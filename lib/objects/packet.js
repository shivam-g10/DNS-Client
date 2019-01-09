class Packet {
    constructor() {
        this._doc = new Array();
        this.buffer = Buffer.alloc(0);
        this.length = 0;
        this.byteSize = this.buffer.length;
    }
    push(data) {
        this.write(data);
    }
    write(data, isReset) {
        if (typeof data == "string") {
            let isHex = false;
            let isBin = false;
            let isOct = false;
            let isStr = false;
            let isDec = false;
            let maxLen = 2;
            let base = 10;
            if (!isReset) {
                this._doc.push(data);
                this.length = this._doc.length;
            }
            if (isNaN(data)) {
                isStr = true;
            }
            else if (data.indexOf("0x") > -1) {
                isHex = true;
                base = 16;
                data = data.replace("0x", "");
                maxLen = 2;
            }
            else if (data.indexOf("0b") > -1) {
                isBin = true;
                base = 2;
                data = data.replace("0b", "");
                maxLen = 8;
            }
            else if (data.indexOf("0o") > -1) {
                isOct = true;
                base = 8
                data = data.replace("0o", "");
                maxLen = 3;
            }
            else {
                isHex = true;
                base = 16;
                maxLen = 2;
                data = data.toString(16);
            }
            let regex = new RegExp(`.{1,${maxLen}}`, 'g');
            if (!isStr) {
                let dataArray = data.match(regex);
                dataArray = dataArray.map(e => { 
                    return parseInt(e, base);
                });
                this.buffer = Buffer.concat([this.buffer, Buffer.from(dataArray)]);
            }
            else {
                this.buffer = Buffer.concat([this.buffer, Buffer.from(data)]);
            }
        }
        else {
            throw new Error("Only string allowed");
        }
        this.byteSize = this.buffer.length;
    }
    getBuffer() {
        return this.buffer;
    }
    getArray() {
        return this._doc;
    }
    toString(options) {
        return this.buffer.toString(options);
    }
    toJSON() {
        return this.buffer.toJSON();
    }
    resetBuffer() {
        this.buffer = Buffer.alloc(0);
        this.length = this._doc.length;
        for (let i = 0; i < this._doc.length; i++) {
            let value = this._doc[i];
            this.write(value, true);
        }
    }
    pop() {
        let value = this._doc.pop();
        this.resetBuffer();
        return value;
    }
    shift() {
        let value = this.shift();
        this.resetBuffer();
        return value;
    }
    unshift() {
        let value = this.unshift();
        this.resetBuffer();
        return value;
    }
}
module.exports.Packet = Packet;