
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