import { getDeviceInfo } from "@zos/device";
import * as fs from "@zos/fs";

const deviceInfo = getDeviceInfo();
const deviceID = deviceInfo ? deviceInfo.deviceName : "Unknown";
export const isMiBand7 = deviceID === "Xiaomi Smart Band 7";
const appContext = getApp();

// API 3.0 compatible Path class
export class Path {
  constructor(scope, path) {
    if(path[0] != "/") path = "/" + path;

    this.scope = scope;
    this.path = path;

    if (scope === "assets") {
      this.relativePath = path;
      this.absolutePath = FsTools.fullAssetPath(path);
    } else if (scope === "data") {
      this.relativePath = path;
      this.absolutePath = FsTools.fullDataPath(path);
    } else if (scope === "full") {
      this.relativePath = `../../../${path.substring(9)}`;
      if(this.relativePath.endsWith("/"))
        this.relativePath = this.relativePath.substring(0, this.relativePath.length - 1);
      this.absolutePath = path;
    } else {
      throw new Error("Unknown scope provided")
    }
  }

  get(path) {
    if(path == "") {
      return this;
    } else if (this.path === "/" || this.path === ".") {
      return new Path(this.scope, path);
    } else {
      return new Path(this.scope, `${this.path}/${path}`);
    }
  }

  resolve() {
    return new Path("full", this.absolutePath);
  }

  src() {
    if(this.scope !== "assets")
      throw new Error("Can't get src for non-asset");
    return this.relativePath.substring(1);
  }

  stat() {
    if (this.scope == "data") {
      return fs.statSync({ path: this.relativePath });
    } else {
      return fs.statAssetsSync({ path: this.relativePath });
    }
  }

  size() {
    const st = this.stat();
    if(st && st.size) {
      return st.size;
    }

    let output = 0;
    const files = this.list();
    if (files) {
      for(const file of files) {
        output += this.get(file).size();
      }
    }

    return output;
  }

  open(flags) {
    if (this.scope === "data") {
      this._f = fs.openSync({ path: this.relativePath, flag: flags });
    } else {
      this._f = fs.openAssetsSync({ path: this.relativePath, flag: flags });
    }

    return this._f;
  }

  remove() {
    if(this.scope === "assets")
      return this.resolve().remove();

    try {
      fs.rmSync({ path: isMiBand7 ? this.absolutePath : this.relativePath });
      return true;
    } catch (e) {
      return false;
    }
  }

  removeTree() {
    const files = this.list();
    if (files) {
      for(let i in files) {
        this.get(files[i]).removeTree();
      }
    }

    this.remove();
  }

  fetch(limit = Infinity) {
    const st = this.stat();
    if (!st) return null;

    const length = Math.min(limit, st.size);
    const buffer = new ArrayBuffer(st.size);
    this.open(fs.O_RDONLY);
    this.read(buffer, 0, length);
    this.close();

    return buffer;
  }

  fetchText(limit = Infinity) {
    const buf = this.fetch(limit);
    if (!buf) return "";
    const view = new Uint8Array(buf);
    return FsTools.decodeUtf8(view, limit)[0];
  }

  fetchJSON() {
    const text = this.fetchText();
    if (!text) return {};
    return JSON.parse(text);
  }

  override(buffer) {
    this.remove();

    this.open(fs.O_WRONLY | fs.O_CREAT);
    this.write(buffer, 0, buffer.byteLength);
    this.close();
  }

  overrideWithText(text) {
    return this.override(FsTools.strToUtf8(text));
  }

  overrideWithJSON(data) {
    return this.overrideWithText(JSON.stringify(data));
  }

  copy(destEntry) {
    const buf = this.fetch();
    destEntry.override(buf);
  }

  copyTree(destEntry, move = false) {
    if(this.isFile()) {
      this.copy(destEntry);
    } else {
      destEntry.mkdir();
      const files = this.list();
      if (files) {
        for(const file of files) {
          this.get(file).copyTree(destEntry.get(file));
        }
      }
    }

    if(move) this.removeTree();
  }

  isFile() {
    const st = this.stat();
    return st && (st.mode & 32768) != 0;
  }

  isFolder() {
    if(this.absolutePath == "/storage") return true;
    const st = this.stat();
    return st && (st.mode & 32768) == 0;
  }

  exists() {
    return this.stat() !== undefined;
  }

  list() {
    const result = fs.readdirSync({ path: isMiBand7 ? this.absolutePath : this.relativePath });
    return result;
  }

  mkdir() {
    return fs.mkdirSync({ path: isMiBand7 ? this.absolutePath : this.relativePath });
  }

  seek(val) {
    fs.lseekSync({ fd: this._f, offset: val, whence: fs.SEEK_SET });
  }

  read(buffer, offset, length) {
    fs.readSync({ fd: this._f, buffer: buffer, options: { offset: offset, length: length } });
  }

  write(buffer, offset, length) {
    fs.writeSync({ fd: this._f, buffer: buffer, options: { offset: offset, length: length } });
  }

  close() {
    fs.closeSync({ fd: this._f });
  }
}

export class FsTools {
  static getAppTags() {
    if(FsTools.appTags) return FsTools.appTags;

    try {
      const [id, type] = appContext._options.globalData.appTags;
      return [id, type];
    } catch(e) {
      console.log(`Using default app tags. Reason: ${e}`)
      return [1023438, "app"];
    }
  }

  static getAppLocation() {
    if (!FsTools.cachedAppLocation) {
      const [id, type] = FsTools.getAppTags();
      const idn = id.toString(16).padStart(8, "0").toUpperCase();
      FsTools.cachedAppLocation = [`js_${type}s`, idn];
    }

    return FsTools.cachedAppLocation
  }

  static fullAssetPath(path) {
    const [base, idn] = FsTools.getAppLocation();
    return `/storage/${base}/${idn}/assets${path}`;
  }

  static fullDataPath(path) {
    const [base, idn] = FsTools.getAppLocation();
    return `/storage/${base}/data/${idn}${path}`;
  }

  static strToUtf8(str) {
    var utf8 = [];
    for (var i = 0; i < str.length; i++) {
      var charcode = str.charCodeAt(i);
      if (charcode < 0x80) utf8.push(charcode);
      else if (charcode < 0x800) {
        utf8.push(0xc0 | (charcode >> 6),
          0x80 | (charcode & 0x3f));
      } else if (charcode < 0xd800 || charcode >= 0xe000) {
        utf8.push(0xe0 | (charcode >> 12),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f));
      } else {
        i++;
        charcode = 0x10000 + (((charcode & 0x3ff) << 10) |
          (str.charCodeAt(i) & 0x3ff));
        utf8.push(0xf0 | (charcode >> 18),
          0x80 | ((charcode >> 12) & 0x3f),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f));
      }
    }

    return new Uint8Array(utf8).buffer;
  }

  static decodeUtf8(array, outLimit = Infinity, startPosition = 0) {
    let out = "";
    let length = array.length;

    let i = startPosition,
      c, char2, char3;
    while (i < length && out.length < outLimit) {
      c = array[i++];
      switch (c >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          out += String.fromCharCode(c);
          break;
        case 12:
        case 13:
          char2 = array[i++];
          out += String.fromCharCode(
            ((c & 0x1f) << 6) | (char2 & 0x3f)
          );
          break;
        case 14:
          char2 = array[i++];
          char3 = array[i++];
          out += String.fromCharCode(
            ((c & 0x0f) << 12) |
            ((char2 & 0x3f) << 6) |
            ((char3 & 0x3f) << 0)
          );
          break;
      }
    }

    return [out, i - startPosition];
  }

  static Utf8ArrayToStr(array) {
    return FsTools.decodeUtf8(array)[0];
  }

  static printBytes(val, base2=false) {
    const options = base2 ? ["B", "KiB", "MiB", "GiB"] : ["B", "KB", "MB", "GB"];
    const base = base2 ? 1024 : 1000;

    let curr = 0;
    while (val > 800 && curr < options.length) {
      val = val / base;
      curr++;
    }

    return Math.round(val * 100) / 100 + " " + options[curr];
  }
}
