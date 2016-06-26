(function(){
    function Base(set){
        var _set = set,
            _base = set.length,
            _cv0 = set[0],
            _cv1 = set[1];

        this.nv = function(char){
            if(typeof char != "string")
                throw TypeError("Wrong nv argument type: " + (typeof char) + ", expected string")
                var nv = _set.indexOf(char);
            if(nv == -1){
                throw TypeError("Tried get numeric value of " + JSON.stringify(char) + " in " + JSON.stringify(_set));
            }
            return nv;
        }
        this.cv = function(num){
            if(typeof num != "number")
                throw TypeError("Wrong cv argument type: " + (typeof num) + ", expected number")
                var cv = _set[num];
            if(cv == ""){
                throw TypeError("Tried get base value of " + JSON.stringify(num) + " in " + JSON.stringify(_set));
            }
            return cv;
        }
        this.convert = function(otherBase, value){
            return changeBase(this, otherBase, value);
        }

        Object.defineProperties(
            this, {
                set: {
                    get: function(){return _set}
                },
                cv0: {
                    get: function(){
                        return _cv0;
                    }
                },
                cv1: {
                    get: function(){
                        return _cv1;
                    }
                },
                base: {
                    get: function(){return _base}
                }
            }
        );
    }
    window.Base = Base;

    function repeatString(s,x){
        var r = "";
        for(var i = 0; i < x; i++){
            r += s;
        }
        return r;
    }
    function changeBase(charsetFrom, charsetTo, value){
        function valueInForeignBase(charsetTarget, value){
            var b = "",
                charsetToBase = charsetTarget.base;
            while(value != 0){
                b = charsetTarget.cv(value % charsetToBase) + b;
                value = Math.floor(value / charsetToBase);
            }
            return b || charsetTo.cv0;
        }

        var charsetFromBase = charsetFrom.base,
            charsetToBase = charsetTo.base,
            i = 0,
            valueLength = value.length,
            converted = charsetTo.cv0,
            factor = (charsetFromBase < charsetToBase) ?
            charsetTo.cv(charsetFromBase) :
        valueInForeignBase(charsetTo, charsetFromBase);

        for(i; i < valueLength; i++){
            var char = value[i];
            var charValInTargetBase = valueInForeignBase(charsetTo, charsetFrom.nv(char));

            charValInTargetBase = simplify(charsetTo, charValInTargetBase);
            converted = add(
                charsetTo,
                multiply(
                    charsetTo,
                    converted,
                    factor
                ),
                charValInTargetBase
            );
        }
        return converted;
    }

    function arraysEqual(arr1, arr2) {
        if(arr1.length !== arr2.length)
            return false;
        for(var i = arr1.length; i--;) {
            if(arr1[i] !== arr2[i])
                return false;
        }

        return true;
    }

    function multiply(charset, val1, val2){
        var base = charset.base,
            val1l = val1.length,
            val2l = val2.length,
            i,
            j,
            remainer = 0,
            segments = [],
            sum;

        for(i = 0; i < val1l; i++){
            for(j = 0; j < val2l; j++){
                var numVal =
                    charset.nv(
                        val1[(val1l-1) - i]
                    ) *
                    charset.nv(
                        val2[(val2l-1) - j]
                    ) + remainer;

                segments.push(simplify(charset, charset.cv(numVal % base) + repeatString(charset.cv0, i + j)));
                remainer = Math.floor(numVal / base);
            }
            if(remainer != 0){
                segments.push(simplify(charset, charset.cv(remainer) + repeatString(charset.cv0, i + j)));
                remainer = 0;
            }
        }
        /*if(remainer != 0){
            segments.push(simplify(charset, charset.cv(remainer) + repeatString(charset.cv0, (val1l + val2l) - 1)));
        }*/
        segments = segments.filter(function(v){
            return !v.match(new RegExp("^" + escapeRegExp(charset.cv0) + "+$"));
        });
        if(segments.length == 0){
            return charset.cv0;
        } else {
            sum = segments[0];
            for(i = 1, j = segments.length; i < j; i++){
                sum = add(charset, sum, segments[i]);
            }
            return sum;
        }
    }

    function add(charset, val1, val2){
        var base = charset.base,
            val1l = val1.length,
            val2l = val2.length,
            i,
            j,
            remainer = 0,
            sum = "";

        for(i = 0, j = Math.max(val1l, val2l); i < j; i++){
            var val1V = (i >= val1l) ? 0 : charset.nv(val1[(val1l-1) - i]);
            var val2V = (i >= val2l) ? 0 : charset.nv(val2[(val2l-1) - i]);
            var numVal = val1V + val2V + remainer;
            sum = charset.cv(numVal % base) + sum;
            remainer = Math.floor(numVal / base);
        }
        if(remainer != 0){
            sum = charset.cv(remainer) + sum;
        }
        sum = simplify(charset, sum);
        return sum;
    }

    function simplify(charset, value){
        value = value.replace(new RegExp("^" + escapeRegExp(charset.cv0) + "+"), "");

        return value || charset.cv0;
    }
    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }




    /*function test(base1chars, base2chars, value){
        var a = new Base(base1chars),
            b = new Base(base2chars),
            converted = a.convert(b, value),
            reversed = b.convert(a, converted),
            equal = reversed === value;
        console.log({value, converted, reversed, equal});
    }
    test("01", "0123456789ABCDEF", "100001001111010001001110100010");
    test("0123456789ABCDEF", "01", "213D13A2");
    test("01", "012", "100001001111010001001110100010");
    test("01", "012345", "100001001111010001001110100010");
    test("01", "0123456789", "100001001111010001001110100010");
    test("012345678", "0123456789", "8835467110346480");
    test("0123456789", "01234", "90");
    test("01234", "0123456789", "330");*/
})()