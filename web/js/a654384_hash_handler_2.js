waitFor(window, "Base", function(){
    function HashHandler(){
        this._private = {
            propIndex: 0,
            propTables: {
                decoded: [],
                encoded: []
            },
            enums: {}
        };
    }

    HashHandler.encodedBase = {
        fragment: new Base(":!$&'()*+,;=-._~@/?ABCDEFGHIJKLMNOPQRSTUVWXYabcdefghijklmnopqrstuvwxyz0123456789")
    }

    var bases = {num: new Base(":1234567890,.")};
    bases.alphanum = new Base(bases.num.set + "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
    bases.nested = new Base(bases.alphanum.set + "{}[]");
    bases.full = new Base(bases.nested.set + "\\/;*!&~\"#'-|_`@=");
    HashHandler.decodedBase = bases;

    HashHandler.prototype.registerProperties = function(props){
        var _ = this._private,
            i,
            v;
        for(i in props){
            if(!hop(props, i))
                continue;

            v = props[i];
            _.propTables.decoded.push(i)
            _.propTables.encoded.push(_.propIndex);
            if(!isNA(v) && v.constructor.name == "Array"){
                _.enums[_.propIndex] = v;
            }


            _.propIndex++
        }
    }
    HashHandler.prototype.encode = function(obj, setToUrl, noSuperEncode){
        obj = Object(obj);

        var _ = this._private,
            propEncoded = {},
            encoded = _.propTables.encoded,
            decoded = _.propTables.decoded,
            ek = Object.keys(_.enums),
            swap,
            key,
            value;

        for(i in obj){
            if(!hop(obj, i))
                continue;

            key = (swap = decoded.indexOf(i)) != -1 ? encoded[swap] : i;
            value = obj[i];
            value = !isNA(swap = _.enums[key]) ?
                ((swap = swap.indexOf(value)) != -1 ? swap : value) : value;
            if(value === true){
                value = 1;
            } else if(value === false){
                value = 0
            }
            propEncoded[key] = value;
        }

        var propEncodedStr = JSON.stringify(propEncoded);
        propEncodedStr = propEncodedStr.slice(1).slice(0, -1).replace(/"/g, "");
        propEncodedStr = propEncodedStr.replace(/^0:/,"");

        var propEncodedStrBak = propEncodedStr;

        noSuperEncode = (noSuperEncode === true) ? true : false;
        if(!noSuperEncode){
            var wasSuperEncoded = false,
                i,
                j = 0,
                k = propEncodedStr.length;
            for(i in HashHandler.decodedBase){
                for(; j < k; j++){
                    // If the char is not a part of the base, then try the next
                    if(HashHandler.decodedBase[i].set.indexOf(propEncodedStr[j]) == -1){
                        break;
                    }
                }
                // If all string was tested ok
                if(j === k){
                    wasSuperEncoded = true;
                    propEncodedStr = HashHandler.decodedBase[i].convert(HashHandler.encodedBase.fragment, propEncodedStr);
                    break;
                }
            }
            if(!wasSuperEncoded){
                throw "Unable to super-encode the following string: \"" + propEncodedStr + '"';
            }
            // Prefix the propEncodedStr with the char in the target set at the index of the base used
            var baseIndex = Object.keys(HashHandler.decodedBase).indexOf(i);
            propEncodedStr = HashHandler.encodedBase.fragment.set[baseIndex] + propEncodedStr;
        }

        console.info('String was encoded from ' + JSON.stringify(propEncodedStrBak) + ' to ' + JSON.stringify(propEncodedStr) + ': diff of ' + (propEncodedStr.length - propEncodedStrBak.length) + ' chars.');

        if(typeof setToUrl === "undefined" || setToUrl === true){
            try {
                if (history.pushState) {
                    history.pushState(null, null, '#' + propEncodedStr);
                } else {
                    location.hash = '#' + propEncodedStr;
                }
            } catch (e) {
                console.error("Could not change hash:", e);
            }
        }
        return propEncodedStr;
    }

    HashHandler.prototype.decode = function(value, noSuperEncode){
        if(isNA(value)){
            value = location.hash.slice(1);
        }

        noSuperEncode = (noSuperEncode === true) ? true : false;
        if(!noSuperEncode){
            var baseC = value[0],
                baseI = HashHandler.encodedBase.fragment.set.indexOf(baseC),
                baseN = Object.keys(HashHandler.decodedBase)[baseI],
                base = HashHandler.decodedBase[baseN];
            value = value.slice(1);
            try{
                value = HashHandler.encodedBase.fragment.convert(base, value);
            } catch(e){
                console.error("Fragment string not properly encoded. ", value);
                return {};
            }
        }
        if(value.indexOf(",") < value.indexOf(":")){
            value = "0:" + value;
        }
        value = "{" + value + "}";
        value = value.replace(/(\{|,)([^:]+)|([a-zA-Z]+)/g,'$1"$2$3"');
        var obj;

        try{
            obj = JSON.parse(value);
        } catch(e){
            console.error("Could not parse decoded from string. JSON was", value);
            return {};
        }

        var _ = this._private,
            propDecoded = {},
            encoded = _.propTables.encoded,
            decoded = _.propTables.decoded,
            ek = Object.keys(_.enums),
            swap,
            key,
            value;

        for(i in obj){
            if(!hop(obj, i))
                continue;

            key = (swap = encoded.indexOf(parseInt(i))) != -1 ? decoded[swap] : i;
            value = obj[i];
            value = !isNA(swap = _.enums[i]) ?
                ((swap = swap[value])? swap : value) : value;
            if(value === true){
                value = 1;
            } else if(value === false){
                value = 0
            }
            propDecoded[key] = value;
        }
        return propDecoded;
    }

    window.HashHandler = HashHandler;
});