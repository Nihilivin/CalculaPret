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

    /**
     * @class Calculator
     * @description Base class that  handles calculations
     * @author Gerkin
     */
    function Calculator() {
        var amount,
            duration,
            rate,
            payment,
            paymentYear = null,
            paymentTotal = null;

        Object.defineProperties(this, {
            /**
             * @member {Integer} amount
             * @description Amount of money borrowed
             * @memberof Calculator
             * @public
             * @instance
             */
            amount: {
                get: function () {
                    return amount;
                },
                set: function (newAmount) {
                    newAmount = parseFloat(newAmount);
                    if (isFinite(newAmount) && newAmount > 0) {
                        amount = newAmount;
                    } else {
                        amount = NaN;
                    }
                }
            },
            /**
             * @member {Integer} rate
             * @description Annual rate of the loan
             * @memberof Calculator
             * @public
             * @instance
             */
            rate: {
                get: function () {
                    return rate;
                },
                set: function (newRate) {
                    newRate = parseFloat(newRate);
                    if (isFinite(newRate) && newRate > 0) {
                        rate = newRate;
                    } else {
                        rate = NaN;
                    }
                }
            },
            /**
             * @member {Integer} duration
             * @description Total duration of the loan, in years
             * @memberof Calculator
             * @public
             * @instance
             */
            duration: {
                get: function () {
                    return duration;
                },
                set: function (newDuration) {
                    newDuration = parseFloat(newDuration);
                    if (isFinite(newDuration) && newDuration > 0) {
                        duration = newDuration;
                    } else {
                        duration = NaN;
                    }
                }
            },
            /**
             * @member {Integer} payment
             * @description Payment of a mensuality
             * @memberof Calculator
             * @public
             * @instance
             */
            payment: {
                get: function () {
                    return payment;
                },
                set: function (newPayment) {
                    newPayment = parseFloat(newPayment);
                    if (isFinite(newPayment) && newPayment > 0) {
                        payment = newPayment;
                    } else {
                        payment = NaN;
                    }
                }
            },
            /**
             * @member {Integer} paymentYear
             * @description Payment of a year of mensualities
             * @memberof Calculator
             * @public
             * @instance
             * @readonly
             */
            paymentYear: {
                get: function (){
                    return paymentYear;
                },
                set: function (newPaymentYear) {
                    newPaymentYear = parseFloat(newPaymentYear);
                    if (isFinite(newPaymentYear) && newPaymentYear > 0) {
                        paymentYear = newPaymentYear;
                        paymentTotal = newPaymentYear * duration;
                    } else {
                        paymentYear = NaN;
                        paymentTotal = NaN;
                    }
                }
            },
            paymentTotal: {
                get: function(){
                    return paymentTotal;
                },
                set: function(newPaymentTotal){
                    paymentTotal = newPaymentTotal;
                }
            }
        });
    }
    Calculator.prototype = {
        /**
         * @function calc_amount
         * @memberof Calculator
         * @description Calculates the {@link Calculator#amount amount borrowed}, according to given {@link Calculator#duration duration}, {@link Calculator#rate rate} and {@link Calculator#payment monthly payment}
         * @author Gerkin
         * @returns {float} The amount of the loan
         */
        calc_amount: function () {
            var self = this,
                mensualRate = self.rate / 1200;
            return self.payment * ((1 - (1 / Math.pow(1 + mensualRate, 12 * self.duration))) / mensualRate);
        },
        /**
         * @function calc_duration
         * @memberof Calculator
         * @description Calculates the {@link Calculator#duration duration} of the loan, according to given {@link Calculator#amount amount borrowed}, {@link Calculator#rate rate} and {@link Calculator#payment monthly payment}
         * @author Gerkin
         * @returns {float} The duration of the loan
         */
        calc_duration: function () {
            var self = this,
                r = self.rate / 1200;
            return Math.log(-self.payment / ((r * self.amount) - self.payment)) / (12 * Math.log(r + 1));
        },
        /**
         * @function calc_rate
         * @memberof Calculator
         * @description Calculates the {@link Calculator#rate annual rate} of the loan, according to given {@link Calculator#amount amount borrowed}, {@link Calculator#duration duration} and {@link Calculator#payment monthly payment}. Notice: this function is iterative, and may return non-exact values
         * @author Gerkin
         * @returns {float} The annual rate of the loan
         */
        calc_rate: function () {
            var self = this,
                tempCalc = new Calculator(),
                rate = 0,
                lastRate,
                step = 1,
                exitCount = 0,
                amount;
            if (self.payment * (self.duration * 12) < self.amount) {
                return NaN;
            }
            tempCalc.duration = self.duration;
            tempCalc.payment = self.payment;
            while (step > 0.0001 && exitCount <= 999) {
                exitCount++;
                lastRate = rate;
                rate += step;
                tempCalc.rate = rate;
                amount = tempCalc.calc_amount();
                if (amount < self.amount) {
                    step /= 10;
                    rate = lastRate;
                } else if (amount === self.amout) {
                    break;
                }
            }
            console.log(step, rate);
            return (exitCount < 1000 ? rate : NaN)   ;
        },
        /**
         * @function calc_payment
         * @memberof Calculator
         * @description Calculates the {@link Calculator#payment monthly payment} of the loan, according to given {@link Calculator#amount amount borrowed}, {@link Calculator#rate rate} and {@link Calculator#duration duration}
         * @author Gerkin
         * @returns {float} The monthly payment of the loan
         */
        calc_payment: function () {
            var self = this,
                mensualRate = self.rate / 1200;
            return (self.amount * mensualRate) / (1 - (1 / Math.pow((1 + mensualRate), 12 * self.duration)));
        }
    };