const assert = require('assert');
class Question {
    constructor(options) {
        assert(typeof options == "object" || !options);
        if (options) {
            if (options.name) {
                this.setName(options.name);
            }
            if (options.type) {
                this.setType(options.type);
            }
            if (options.class) {
                this.setClass(options.class);
            }
        }
    }
    setName(domain) {
        assert(typeof domain == "string")
        let subDomains = domain.split("\.");
        let name = "0x";
        if (subDomains.length > 0) {
            this.domain = domain;
            for (let i = 0; i < subDomains.length; i++) {
                let subDomain = subDomains[i];
                if (subDomain) {
                    let length = subDomain.length.toString(16);
                    if (length.length % 2 > 0) {
                        length = "0" + length;
                    }
                    name += length;
                    name += subDomain.split("").map(e => {
                        let hexValue = e.charCodeAt(0).toString(16);
                        if (hexValue.length % 2) {
                            hexValue = "0" + hexValue;
                        }
                        return hexValue;
                    }).join("");
                }
            }
        }
        this.name = name + "00";
    }
    setType(type) {
        assert(typeof type == "string" && (parseInt(type) || parseInt(type, 2) || parseInt(type, 8) || parseInt(type, 16)))
        this.type = type;
    }
    setClass(cls) {
        assert(typeof cls == "string" && (parseInt(cls) || parseInt(cls, 2) || parseInt(cls, 8) || parseInt(cls, 16)))
        this.class = cls;
    }
    getAsJSON() {
        return {
            name: this.name,
            type: this.type,
            class: this.class,
            domain: this.domain
        }
    }
}

module.exports.Question = Question;