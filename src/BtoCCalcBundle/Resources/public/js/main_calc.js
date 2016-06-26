/**
 * @file Main calculator client-side script
 *
 * @author Alexandre Germain
 * @copyright 2016 GerkinDevelopment
 * @license none none
 * @package creditcalc
 *
 * @version 0.2.0
 */

/*jslint plusplus: true */
/*jshint strict: true */
/*jslint nomen: true*/
/*jslint browser: true, devel: true, regexp: true, white:true */
/*global d, Event */

/**
 * @callback EventFunction
 * @param {object} event Event object emitted
 */
/**
 * @typedef DOMElement
 * @type {object}
 * @description {@link http://www.w3schools.com/jsref/dom_obj_all.asp See definition on w3schools.com}
 * @see http://www.w3schools.com/jsref/dom_obj_all.asp
 */

const LINES_MAX_COUNT = 15;// Change to display more rows
var crossPageData = {};

(function () {
    'use strict';

    var w = window,
        d = document;


    var hashHandler = new HashHandler();
    hashHandler.registerProperties({
        amount: 1,
        duration: 1,
        rate: 1,
        payment: 1,
        paymentYear: 1,
        paymentTotal: 1,
        wasCalc: [
            "amount",
            "duration",
            "rate",
            "payment"
        ],
        graph_1_mode: [
            "m",
            "y"
        ]
    });
    w.hashHandler = hashHandler;


    var months = {
        1: {
            full: "Janvier",
            short: "Janv."
        },
        2: {
            full: "Février",
            short: "Févr."
        },
        3: {
            full: "Mars",
            short: "Mars"
        },
        4: {
            full: "Avril",
            short: "Avr."
        },
        5: {
            full: "Mai",
            short: "Mai"
        },
        6: {
            full: "Juin",
            short: "Juin"
        },
        7: {
            full: "Juillet",
            short: "Juil."
        },
        8: {
            full: "Aout",
            short: "Aout"
        },
        9: {
            full: "Septembre",
            short: "Sept."
        },
        10: {
            full: "Octobre",
            short: "Oct."
        },
        11: {
            full: "Novembre",
            short: "Nov."
        },
        12: {
            full: "Décembre",
            short: "Déc."
        }
    },
        /**
     * @global
     * @name calculator
     * @type {Calculator}
     * @description The main {@link Calculator} instance
     */
        calculator = new Calculator(),
        /**
     * @global
     * @name formElems
     * @type {object}
     * @property {DOMElement}  calculatorVariables.calc The calcul trigger button
     * @description {@link DOMElement DOMElements} stored in memory to avoid most of the DOM queries
     */
        formElems = {},
        /**
     * @global
     * @name calculatorVariables
     * @description The list of handled form sets
     * @type {string[]}
     * @readonly
     * @enum {string}
     */
        calculatorVariables = {"amount": 0, "duration": 1, "rate": 2, "payment": 3},

        graphElems = {y:[],m:[]},
        bodyGraph = gei("graph_1-body_scroll"),
        bodyGraphYear = gei("graph_1-body_scroll-container-years"),
        bodyGraphMonth = gei("graph_1-body_scroll-container-months"),
        prototype = qs(".html-prototype",bodyGraph),
        pseudoContainer = d.createElement("div"),
        prototypeStr,
        graph_1 = gei("graph_1"),
        scrollInMaxHeight,
        graph_1_mode = "y",
        scrollArea = geiN("graph_1-scroll_area"),
        scrollContainer = gei("graph_1-body_scroll-container");
    w.formElems = formElems;




    calculatorVariables = Object.keys(calculatorVariables);
    window.calculator = calculator;
    prototype.classList.remove("html-prototype")
    pseudoContainer.appendChild(prototype);
    prototypeStr = pseudoContainer.innerHTML;


    /**
 * @function _init
 * @description Init function called once global var are initialized
 * @author Gerkin
 * @inner
 */
    on(window, "load", function _init() {
        /**
         * @function getNumFieldValue
         * @description convert a {@link isParsableNumber parsable string} into a float.
         * @author Gerkin
         * @param   {string|number} str The value to ensure float
         * @returns {number} Numeric value
         */
        function getNumFieldValue(str) {
            return parseFloat(String(str).replace(/ /g, "").replace(/,/g, ".") || 0);
        }
        /**
         * @function preciseValue
         * @description Returns a numeric-casted value of value with the good precision
         * @author Gerkin
         * @param   {calculatorVariables} type  The type of the var. See the list of vars used
         * @param   {string|number} value The string or numeric value to cast
         * @returns {float} Value with the precision according to type
         * @use getNumFieldValue
         */
        function preciseValue(type, value) {
            value = getNumFieldValue(value);
            if (["amount", "payment", "rate"].indexOf(type) !== -1) {
                return (parseFloat((Math.ceil(value * 100)).toFixed(0)) / 100).toFixed(2);
            } else if (type === "duration") {
                return Math.ceil(value).toFixed(0);
            } else if (type === "roundMoney") {
                return (parseFloat((Math.round(value * 100)).toFixed(0)) / 100).toFixed(2);
            }
        }
        /**
         * @function formatDisplayable
         * @description Takes a float and format it with spaces and comma as separator
         * @author Gerkin
         * @param   {float} value  The numeric value to format
         * @returns {string} Displayable string
         */
        function formatDisplayable(value) {
            value += "";
            var parts = value.match(/^(\d*)(?:[.,](\d*))?$/),
                regexReplacePost = /(.*\d)(\d{3})/,
                returnStr,
                regexReplacePre = /(\d{3})(.*\d)/;
            if (isNA(parts) || parts.length === 0) {
                return "";// If the pattern is invalid, return an empty value
            }
            while (parts[1].match(regexReplacePost)) {
                parts[1] = parts[1].replace(regexReplacePost, "$1 $2");
            }
            returnStr = parts[1];
            if (!isNA(parts[2])) {
                returnStr += ",";
                while (parts[2].match(regexReplacePre)) {
                    parts[2] = parts[2].replace(regexReplacePre, "$1 $2");
                }
                returnStr += parts[2];
            }
            return returnStr;
        }
        /**
         * @function isParsableNumber
         * @description Check if the input string contains only understandable chars & with the right format
         * @author Gerkin
         * @param   {string} value  The string to check
         * @returns {boolean} True if parsable, false otherwise. Note: a string with a length of 0 is not parsable
         */
        function isParsableNumber(value) {
            if (value.length > 0) {
                return !(value.match(/[^0-9,. ]/) ||
                         ((value.match(/[.,]/g) || []).length > 1) ||
                         !value.match(/^\d/) ||
                         !value.match(/\d$/));
            }
            return false;
        }
        /**
         * @function enableCalcButtons
         * @description Check each calculation, padlock & pager buttons and set them disabled/enabled depending on missing & provided values.
         * @author Gerkin
         */
        function enableCalcButtons() {
            var type,
                checkValidValue = function (value) {
                    return value !== type && isParsableNumber(formElems[value].value.value);
                };
            for (type in formElems) {
                if (hop(formElems,type)) {
                    formElems[type].padlock.disabled = !isParsableNumber(formElems[type].value.value); // Disable padlock button if non valid value
                    formElems[type].calc.disabled = Object.keys(formElems).filter(checkValidValue).length !== 3; // Enable Calc button if the 3 other values are filled
                }
            }
        }
        /**
         * @function getVarValue
         * @description Retrieves the input value for choosen var. Also clears some styles
         * @author Gerkin
         * @param   {calculatorVariables} type  The name of the var to retrieve
         * @returns {float|0} The numeric value of the input. 0 if invalid
         */
        function getVarValue(type) {
            if (formElems[type] && formElems[type].value) {
                formElems[type].value.classList.remove("calculated");
                return getNumFieldValue(formElems[type].value.value);
            }
            return 0;
        }

        function formatHtmlPrototype(DOMElement, replacements){
            var table = d.createElement('table'),
                tableBody = d.createElement('tbody'),
                DOMClone = DOMElement.cloneNode(true);
            table.appendChild(tableBody);

            DOMClone.classList.remove("html-prototype");

            tableBody.appendChild(DOMClone);
            tableBody.innerHTML = replacePlaceholders(tableBody.innerHTML, replacements);
            return tableBody.firstChild;
        }

        function getPayments(calc) {
            var loanLeft = calc.amount,
                n = 1,
                payments = [],
                maxPaymentsCalc = 12 * LINES_MAX_COUNT + 1;

            while (Math.round(loanLeft * 100) > 0 && n < maxPaymentsCalc) {
                var amount = calc.amount,
                    interests = calc.paymentTotal - calc.amount,
                    payment = calc.payment,
                    rate = calc.rate,
                    monthRate = (rate / 1200),
                    a = monthRate + 1,
                    b = -payment,
                    r = b / (1 - a);
                var newLoanLeft = (Math.pow(a, n) * (amount - r)) + r,
                    newInterestsLeft = (Math.pow(a, n) * (interests - r)) + r;
                n++;
                var newPayment = {
                    interests: loanLeft * monthRate,
                    loan: payment - (loanLeft * monthRate),
                    loanLeft: newLoanLeft,
                    interestsLeft:newInterestsLeft
                };
                loanLeft = newLoanLeft;
                payments.push(newPayment);
            }
            return payments;
        }


        on(window,["mouseup", "mouseleave", "blur"], function(){
            for(var i = 0, j = repeatableButtons.length; i < j; i++){
                go(repeatableButtons[i],"mouseup");
            }
        })
        var dynamicStylesheet = d.createElement('style'),
            repeatableButtons = qsa("button.repeatable"),
            i,
            j,
            initRepeatableButton = function (i) {
                var button = repeatableButtons[i],
                    timer,
                    step,
                    basestep = button.getAttribute("data-timer-basestep") || 500,
                    count;
                on(button, "mousedown", function () {
                    count++;
                    step = basestep / (Math.log(Math.pow(count, 2)) + 1);
                    timer = setTimeout(function () {
                        go(button, "mousedown");
                    }, step);
                });
                on(button, ["mouseup", "mouseleave", "blur"], function () {
                    clearTimeout(timer);
                    step = basestep;
                    count = 0;
                });
                go(button, "mouseup");
            },
            initCalculatorInput = function (i) {
                var j = calculatorVariables[i];
                formElems[j] = {
                    calc: gei(j + "-button"),
                    value: gei(j + "-value"),
                    buttonsContainer: gei(j + "-buttons-plus-minus-container"),
                    padlock: gei(j + "-padlock"),
                    plus: gei(j + "-plus"),
                    minus: gei(j + "-minus")
                };
                formElems[j].value.setAttribute("data-placeholder", formElems[j].value.placeholder);

                // Bind event listeners
                formElems[j].calculate = (function () {
                    var arrNoI = calculatorVariables.filter(function (v) {return v !== j; }),
                        type = j;
                    return function () {
                        // First, deactivate all active line
                        setActiveLine();

                        var c = calculator,
                            k,
                            result,
                            valueContainer = formElems[type].value;

                        for (k in arrNoI) {
                            if (hop(arrNoI,k)) {
                                c[arrNoI[k]] = getVarValue(arrNoI[k]);
                            }
                        }
                        result = c["calc_" + type]();
                        console.log(result);
                        if(type === "payment"){
                            c["paymentYear"] = result * 12;
                        } else {
                            c["paymentYear"] = c["payment"] * 12;
                        }
                        c[type] = result;
                        valueContainer.value = isNaN(result) ? "Impossible" : formatDisplayable(preciseValue(type, result));

                        crossPageData = mergeRecursive(crossPageData,{
                            amount: parseFloat(preciseValue("amount", c.amount)),
                            duration: parseFloat(preciseValue("duration", c.duration)),
                            rate: parseFloat(preciseValue("rate", c.rate)),
                            payment: parseFloat(preciseValue("payment", c.payment)),
                            paymentYear: parseFloat(preciseValue("payment", c.paymentYear)),
                            paymentTotal: parseFloat(preciseValue("payment", c.paymentTotal)),
                            wasCalc: type
                        });
                        hashHandler.encode(crossPageData);

                        valueContainer.classList.add("calculated");
                        enableCalcButtons();
                        generateGraph();
                    };
                }());
                on(formElems[j].calc, "click", formElems[j].calculate);
                on([formElems[j].padlock], "click", (function () {
                    var target = formElems[j].buttonsContainer;
                    return function () {
                        target.classList.toggle("locked");

                        // Disable field if padlock is on
                        formElems[j].value.readOnly = target.classList.contains("locked");


                        var doIncrement = calculatorVariables.filter(function (value) {
                            return formElems[value].buttonsContainer.classList.contains("locked");
                        }).length === 2;
                        calculatorVariables.forEach(function (value) {
                            var bc = formElems[value].buttonsContainer;
                            if (!bc.classList.contains("locked") && doIncrement === true) {
                                bc.classList.add("increment");
                            } else {
                                bc.classList.remove("increment");
                            }
                        });
                    };
                }()));
                on([formElems[j].plus, formElems[j].minus], "mousedown", (function () {
                    var target = formElems[j].value,
                        type = j;
                    return function valueIncDec(e) {
                        var factor,
                            step, // Incremental/decremental step
                            bounds, // Defines the min & max values
                            dec,
                            rev,
                            tempvalue; // Force round value
                        if (e.target.id === type + "-plus") {
                            factor = 1;
                        } else if (e.target.id === type + "-minus") {
                            factor = -1;
                        } else {
                            factor = 0;
                        }

                        switch (type) {
                            case "duration":
                                dec = 0.001;
                                step = 1;
                                bounds = [1,+Infinity];
                                break;

                            case "amount":
                            case "payment":
                                for(rev = 1, tempvalue = getNumFieldValue(target.value); tempvalue > 100 - factor; rev *= 10) {
                                    tempvalue /= 10;
                                }
                                dec = 0.001;
                                step = rev;
                                bounds = [0,+Infinity];
                                break;

                            case "rate":
                                dec = 0.001;
                                if(getNumFieldValue(target.value) > 10) {
                                    step = 1;
                                } else if (getNumFieldValue(target.value) < 1 - factor*0.001) {
                                    step = 0.01;
                                } else {
                                    step = 0.1;
                                }

                                bounds = [0,10];
                                break;
                        }
                        target.value = formatDisplayable(
                            preciseValue(
                                type,
                                Math.max(
                                    bounds[0],
                                    Math.min(
                                        bounds[1],
                                        getNumFieldValue(target.value) + step * factor
                                    )
                                ).toFixed(2) - dec
                            )
                        );
                        enableCalcButtons();
                        calculatorVariables.forEach(function(value){
                            if(value !== j && formElems[value].buttonsContainer.classList.contains("increment")) {
                                formElems[value].calculate();
                            }
                        });
                    };
                }()));
                /**
                 * @function clearInputStyles
                 * @description Clear class, custom validity & placeholder from input
                 * @author Gerkin
                 * @inner
                 */
                on(formElems[j].value,"focus", function clearInputStyles(){
                    this.setCustomValidity("");
                    this.placeholder = '';
                    this.classList.remove("calculated");
                });
                /**
             * @function checkInput
             * @description Checks if the input has a parsable value, and set the custom validity. Also, it refresh calculation buttons states
             * @author Gerkin
             * @inner
             */
                on(formElems[j].value,["blur","keyup","change","input"], function checkInput(){
                    var self = this,
                        value = self.value.trim();

                    if(!isParsableNumber(value) && value.length > 0){
                        self.setCustomValidity("Cette valeur n'est pas une valeur numérique acceptable");
                    } else {
                        self.setCustomValidity("");
                    }
                    enableCalcButtons();
                });
                /**
             * @function filterChars
             * @description Allow only some chars in input. If the pressed key is not allowed, this function will kill the event and prevent the char from being added
             * @author Gerkin
             * @param   {KeyboardEvent} e Event emitted by "keypress" event
             * @inner
             */
                on(formElems[j].value,"keypress", function filterChars(e){
                    if(!String.fromCharCode(e.which || e.keyCode).match(/^[0-9,. ]$/)) {
                        e.preventDefault();
                    }
                    if((e.which || e.keyCode) == 13){ // On "enter"
                        formElems[j].calculate();
                    }
                });
                /**
             * @function formatInput
             * @description Reformat the input value, and re-check value validity
             * @author Gerkin
             * @inner
             */
                on(formElems[j].value,"blur", function formatInput(){
                    var self = this;
                    self.placeholder = self.getAttribute("data-placeholder");
                    if(isParsableNumber(self.value)){
                        self.value = formatDisplayable(preciseValue(j, self.value));
                    }else if(self.value === ""){
                        self.setCustomValidity("");
                    }else{
                        self.setCustomValidity("Cette valeur n'est pas une valeur numérique acceptable");
                    }
                });
            },
            crossPageData = hashHandler.decode(),
            wasCalculated;

        dynamicStylesheet.id = "dynamicStylesheet";
        document.head.appendChild(dynamicStylesheet);



        var resizeGraphContainerMode = (function(){
            var graphFoot = geiN("graph_1-foot"),
                refund = geiN("refund"),
                scrollCursor = geiN("graph_1-scroll_cursor"),
                scrollLine = geiN("graph_1-scroll_line"),
                scrollArea = geiN("graph_1-scroll_area"),
                buttonsAction = qs(".action-buttons"),
                basicData = geiN("basic_data");

            var innerResizeGraphContainerMode = function(){
                // Resize graph-1 padder
                var firstYRow = qsN("#graph_1-body_scroll-container-years .graph_1-line.inside"),
                    lastYRow = qsN("#graph_1-body_scroll-container-years .graph_1-line.inside.last"),
                    firstMRow = qsN("#graph_1-body_scroll-container-months .graph_1-line.inside"),
                    lastMRow = qsN("#graph_1-body_scroll-container-months .graph_1-line.inside.last");
                scrollInMaxHeight = {
                    y: (lastYRow.offsetTop + /*lastRow.offsetHeight*/50) - firstYRow.offsetTop,
                    m: (lastMRow.offsetTop + /*lastRow.offsetHeight*/50) - firstMRow.offsetTop
                };


                scrollContainer.style.top = Math.min(
                    Math.max(
                        -(scrollInMaxHeight[graph_1_mode] - bodyGraph.offsetHeight),
                        scrollContainer.style.top.slice(0,-2)
                    ),
                    0
                ) + "px";



                scrollArea.style.maxHeight = scrollInMaxHeight[graph_1_mode] + "px";
                var graph1OptimalHeight = ((graphFoot.offsetTop + graphFoot.offsetHeight + 40) - refund.offsetTop) + scrollInMaxHeight[graph_1_mode] - scrollArea.offsetHeight;
                graph_1.style.maxHeight = graph1OptimalHeight + "px";
                setTimeout(function(){
                    var scrollCursorMaxHeight = Math.min(
                        basicData.offsetHeight - (scrollArea.offsetTop + graphFoot.offsetHeight + buttonsAction.offsetHeight + 60),
                        scrollInMaxHeight[graph_1_mode] - 10
                    );
                    var scrollCursorHeight = Math.min(
                        (scrollArea.offsetHeight / scrollInMaxHeight[graph_1_mode]) *
                        scrollCursorMaxHeight,
                        scrollInMaxHeight[graph_1_mode] - 10
                    );
                    scrollCursor.style.height = scrollCursorHeight + "px";
                    var offsetTop = parseFloat(scrollCursor.style.top.slice(0,-2)) || 0,
                        newOfffsetTop = Math.max(
                            0,
                            Math.min(
                                scrollCursorMaxHeight - scrollCursorHeight,
                                offsetTop
                            )
                        );
                    if(offsetTop != newOfffsetTop){
                        scrollCursor.style.top = newOfffsetTop;
                    }
                }, 100);
            }
            return function(){
                setTimeout(function(){
                    innerResizeGraphContainerMode();
                    resizeGraphContainerMode = function(){
                        innerResizeGraphContainerMode();
                        setTimeout(innerResizeGraphContainerMode, 500);
                    }
                    qs("body").classList.add("ready_graph_1");
                }, 500)
            }
        })();


        var resizeListenerInited = false,
            onceFlexboxInited = false,
            resizeGraphElemsPtr = null,
            scrollCursor = gei("graph_1-scroll_cursor"),
            scrollLine = gei("graph_1-scroll_bar"),
            intervalResizeScrollBar,
            lineinfos = gei("graph_1-lineinfos"),
            geh_right = gei("graph-elem-hover-right"),
            geh_left = gei("graph-elem-hover-left"),
            headEurPerPx,
            lastLineData,
            flexRightWidth,
            flexLeftWidth;

        function setActiveLine(event){
            var actives = qsa(".graph_1-line.active");
            for(var i = 0, j = actives.length; i < j; i++){
                actives[i].classList.remove("active");
            }
            if(isNA(event)){
                graph_1.classList.remove("has-active-line");
                geh_left.style.width = "0px";
                geh_right.style.width = "0px";
                lineinfos.style.left = "0px";
                lineinfos.style.right = "0px";
                lineinfos.firstElementChild.style.width = "0px";
                lineinfos.lastElementChild.style.width = "0px";
            } else {
                var lineData;
                if(event !== true){
                    graph_1.classList.add("has-active-line");
                    var target = event.target;
                    while(!target.classList.contains("graph_1-line")){
                        target = target.parentElement;
                    }
                    target.classList.add("active");

                    for(var i = 0, j = target.parentElement.childNodes.length; i < j; i++){
                        if (target.parentElement.childNodes[i] == target)
                            break;
                    }
                    i--;
                    if(graph_1_mode === "m"){
                        lineData = inRange.m[Object.keys(inRange.m)[i]];
                    } else if(graph_1_mode === "y"){
                        lineData = inRange.y[Object.keys(inRange.y)[i]];
                    }
                    lastLineData = lineData;
                } else {
                    lineData = lastLineData;
                }
                if(!lineData)
                    return;
                console.info("Displaying infos for:",lineData);

                var leftSize = ((calculator.amount - lineData.loanLeft) / headEurPerPx) || 0,
                    rightSize = (((calculator.paymentTotal - calculator.amout) - lineData.interestsLeft) / headEurPerPx) || 0;
                geh_left.style.width = leftSize + "px";
                geh_right.style.width = rightSize + "px";
                lineinfos.style.left = (flexLeftWidth - leftSize) + "px";
                lineinfos.style.right = (flexRightWidth - rightSize) + "px";
                lineinfos.firstElementChild.style.width = (leftSize - 10) + "px";
                lineinfos.lastElementChild.style.width = (rightSize - 10) + "px";/*
                lineinfos.firstElementChild.style.left = leftSize + "px";
                lineinfos.lastElementChild.style.right = rightSize + "px";*/



                resizeGraphContainerMode();
            }
        }


        // Enable repeatable buttons
        for (i = 0, j = repeatableButtons.length; i < j; i++) {
            initRepeatableButton(i);
        }
        for (i in calculatorVariables) {
            if (hop(calculatorVariables,i)) {
                initCalculatorInput(i);
            }
        }
        // Try to load hash
        if(Object.keys(crossPageData).length !== 0 && crossPageData.constructor === Object) {
            var calcFields = ["payment", "paymentYear", "paymentTotal", "amount", "duration", "rate"];
            for(i in calcFields) {
                var field = calcFields[i];
                if (!isNA(crossPageData[field])) {
                    calculator[field] = crossPageData[field];
                    formElems[field] && (formElems[field].value.value = formatDisplayable(preciseValue(field != "paymentYear" ? field : "payment", crossPageData[field])));
                }
            }
            if(!isNA(crossPageData["graph_1_mode"])){
                graph_1_mode = crossPageData["graph_1_mode"];
                graph_1.setAttribute("data-display-mode", graph_1_mode === "m" ? "month":"year");
                geiN("toggle-year_month-input").checked = graph_1_mode === "m";
            }
            if(Object.keys(formElems).filter(function(v){
                return isParsableNumber(formElems[v].value.value)
            }).length === 4){
                wasCalculated = formElems[crossPageData.wasCalc];
                if (wasCalculated) {
                    wasCalculated.value && wasCalculated.value.classList.add("calculated");
                }
                generateGraph(true);
            }
        }
        enableCalcButtons();

        on(gei("toggle-year_month-input"), "change", function(){
            var attr = graph_1.getAttribute("data-display-mode");
            if(!attr || attr == "year"){
                graph_1.setAttribute("data-display-mode", "month");
                crossPageData["graph_1_mode"] = graph_1_mode = "m";
            } else {
                graph_1.setAttribute("data-display-mode", "year");
                crossPageData["graph_1_mode"] = graph_1_mode = "y";
            }
            hashHandler.encode(crossPageData);
            setActiveLine();
            resizeGraphContainerMode();
        });



        function replacePlaceholders(text, replacements){
            text = text.replace(/\{\s*([\w\.]+)\s*\}/g, function(matched, identifier){
                var identifiers = identifier.split("."),
                    swapReplacements = replacements,
                    i = 0,
                    j = identifiers.length;
                for(i; i < j; i++){
                    // Search in both ancestor & current obj
                    if(typeof replacements === "object"){
                        swapReplacements = swapReplacements[identifiers[i]];
                    } else {
                        swapReplacements = "";
                    }
                    if(swapReplacements === ""){
                        break;
                    }
                }
                return swapReplacements || "";
            });
            return text;
        }

        function parseHtml(str){ // /!\ Single node only
            if(document.createRange){
                var range = d.createRange(),
                    fragment;
                range.selectNode(document.body); // required in Safari
                fragment = range.createContextualFragment(str);
                return fragment.firstChild;
            } else {
                var elem = d.createElement("div");
                elem.innerHTML = str;
                return elem.firstChild;
            }
        }


        function generateGraph(onInit){
            clearInterval(intervalResizeScrollBar);
            function getOrderedPayments(calc, dateStart){
                var paymentsList = getPayments(calc),
                    i = 0,
                    j = paymentsList.length,
                    month = dateStart.getMonth(),
                    yearStart = dateStart.getFullYear(),
                    year = yearStart,
                    payments = {};

                for(; i < j && year < yearStart + LINES_MAX_COUNT + 1; i++){
                    if(isNA(payments[year])){
                        payments[year] = {};
                    }
                    payments[year][month + 1] = paymentsList[i];
                    month++;
                    if(month > 11 || i === j - 1 && !isNA(payments[year])){
                        for(var k in payments[year]){
                            if(hop(payments[year],k)) {
                                if(isNA(payments[year].loan)) {
                                    payments[year].loan = 0;
                                }
                                payments[year].loan += payments[year][k].loan;
                                if(isNA(payments[year].interests)) {
                                    payments[year].interests = 0;
                                }
                                payments[year].interests += payments[year][k].interests;
                            }
                        }
                        payments[year].loanLeft = paymentsList[i === j - 1 ? i : i - 1].loanLeft;
                    }
                    if(month > 11){
                        month = 0;
                        year++;
                    }
                }
                return payments;
            }

            var c = calculator,
                dateStart = new Date(), // Change for modulate start of payment. Defaults to "Now"
                dateStart = new Date(dateStart.getFullYear(), dateStart.getMonth() + 1),
                dateEnd = new Date(dateStart.getFullYear() + Math.floor(c.duration), dateStart.getMonth() + Math.round((c.duration % 1) * 12)),
                payments = getOrderedPayments(c,dateStart),
                firstYear = dateStart.getFullYear(),
                extraneousDates = {},
                inRange = {y:{},m:{}};
            w.inRange = inRange;


            // Init years list
            for(var i = 0, year; i < LINES_MAX_COUNT && !isNA(year = payments[firstYear + i]); i++){
                inRange.y[String(firstYear + i)] = {
                    loanLeft: year.loanLeft,
                    loan: year.loan,
                    interests: year.interests
                };
            }
            // Init months list
            var i = -1,
                month = dateStart.getMonth() + 1,
                yearInc = 0,
                yearO,
                monthO;
            while(++i < LINES_MAX_COUNT && !isNA(yearO = payments[firstYear + yearInc]) && !isNA(monthO = yearO[month])){
                inRange.m[months[month].short + " " + (firstYear + yearInc)] = {
                    loanLeft: monthO.loanLeft,
                    loan: monthO.loan,
                    interests: monthO.interests
                };
                month++;
                if(month > 12){
                    yearInc++;
                    month = 1;
                }
            }


            switchText(gei("datestart"),months[dateStart.getMonth() + 1].full + " " + dateStart.getFullYear(),onInit);
            switchText(gei("dateend"),months[dateEnd.getMonth() + 1].full + " " + dateEnd.getFullYear(),onInit);
            switchText(gei("refund_amount"), formatDisplayable(preciseValue("roundMoney",c.paymentTotal)),onInit);
            switchText(gei("payback_amount"), formatDisplayable(preciseValue("roundMoney",c.amount)),onInit);
            switchText(gei("interests_amount"), formatDisplayable(preciseValue("roundMoney",c.paymentTotal - c.amount)),onInit);

            var counter,
                inRangeKeysY = Object.keys(inRange.y),
                inRangeKeysYCount = inRangeKeysY.length,
                inRangeKeysM = Object.keys(inRange.m),
                inRangeKeysMCount = inRangeKeysM.length;

            // Init year lines
            for(counter = 0; counter < inRangeKeysYCount; counter++){
                var key = inRangeKeysY[counter],
                    yearInfos = inRange.y[key],
                    paymentYearFactor = (function(){
                        if(key == dateStart.getFullYear() && key == dateEnd.getFullYear()){
                            return dateEnd.getMonth() - dateStart.getMonth();
                        } else if(key == dateStart.getFullYear()){
                            return 12 - dateStart.getMonth();
                        } else if(key == dateEnd.getFullYear()){
                            return dateEnd.getMonth() + 1
                        } else {
                            return 12
                        }
                    }()) / 12;

                if(isNA(graphElems.y[counter])){
                    // Create the rown
                    var formatted = replacePlaceholders(
                        prototypeStr,
                        {
                            type: "year",
                            label: key,
                            payment: formatDisplayable(preciseValue("roundMoney",c.paymentYear * paymentYearFactor)) + " €",
                            loan_paid: formatDisplayable(preciseValue("roundMoney",yearInfos.loan)) + "€",
                            interests_paid: formatDisplayable(preciseValue("roundMoney",yearInfos.interests)) + "€",
                        }
                    ),
                        newElem = parseHtml(formatted);
                    graphElems.y.push(newElem);
                    bodyGraphYear.appendChild(newElem);
                    on(newElem, "click", setActiveLine);
                    newElem.classList.add("inside");
                    if(counter === inRangeKeysYCount - 1){
                        newElem.classList.add("last");
                    }
                } else {
                    // Edit the row
                    graphElems.y[counter].classList.add("inside");
                    if(counter === inRangeKeysYCount - 1){
                        graphElems.y[counter].classList.add("last");
                    } else {
                        graphElems.y[counter].classList.remove("last");
                    }
                    qsN(".date p", graphElems.y[counter]).innerHTML = key;
                    qsN(".payment p", graphElems.y[counter]).innerHTML = formatDisplayable(preciseValue("roundMoney",c.paymentYear * paymentYearFactor)) + " €";
                    qsN(".refund p", graphElems.y[counter]).innerHTML = formatDisplayable(preciseValue("roundMoney",yearInfos.loan)) + "€";
                    qsN(".interests p", graphElems.y[counter]).innerHTML = formatDisplayable(preciseValue("roundMoney",yearInfos.interests)) + "€";
                }
            }
            for(; counter < LINES_MAX_COUNT; counter++){
                var row = graphElems.y[counter];
                if(!isNA(row)){
                    row.classList.remove("inside");
                    row.classList.remove("last");
                } else {
                    break;
                }
            }

            // Init month lines
            for(counter = 0; counter < inRangeKeysMCount; counter++){
                var key = inRangeKeysM[counter],
                    monthInfos = inRange.m[key];

                if(isNA(graphElems.m[counter])){
                    // Create the rown
                    var formatted = replacePlaceholders(
                        prototypeStr,
                        {
                            type: "month",
                            label: key,
                            payment: formatDisplayable(preciseValue("roundMoney",c.payment)) + " €",
                            loan_paid: formatDisplayable(preciseValue("roundMoney",monthInfos.loan)) + "€",
                            interests_paid: formatDisplayable(preciseValue("roundMoney",monthInfos.interests)) + "€"
                        }
                    ),
                        newElem = parseHtml(formatted);
                    graphElems.m.push(newElem);
                    bodyGraphMonth.appendChild(newElem);
                    on(newElem, "click", setActiveLine);
                    newElem.classList.add("inside");
                    if(counter === inRangeKeysMCount - 1){
                        newElem.classList.add("last");
                    }
                } else {
                    // Edit the row
                    graphElems.m[counter].classList.add("inside");
                    if(counter === inRangeKeysMCount - 1){
                        graphElems.m[counter].classList.add("last");
                    } else {
                        graphElems.m[counter].classList.remove("last");
                    }
                    qsN(".date p", graphElems.m[counter]).innerHTML = key;
                    qsN(".payment p", graphElems.m[counter]).innerHTML = formatDisplayable(preciseValue("roundMoney",c.payment)) + " €";
                    qsN(".refund p", graphElems.m[counter]).innerHTML = formatDisplayable(preciseValue("roundMoney",monthInfos.loan)) + "€";
                    qsN(".interests p", graphElems.m[counter]).innerHTML = formatDisplayable(preciseValue("roundMoney",monthInfos.interests)) + "€";
                }
            }
            for(; counter < LINES_MAX_COUNT; counter++){
                var row = graphElems.m[counter];
                if(!isNA(row)){
                    row.classList.remove("inside");
                    row.classList.remove("last");
                } else {
                    break;
                }
            }


            function equalizeWidths(selector, parents){
                parents = [].slice.call(parents);
                var val = 0,
                    parentsCount = parents.length,
                    i = 0;
                for(; i < parentsCount; i++){
                    var child = qs(selector, parents[i]);
                    if(child){
                        val = Math.max(child.offsetWidth, val);
                    }
                }
                return val;
            }
            var head = gei("graph_1_head"),
                headWidth = head.offsetWidth,
                loopsTestRedim = 0,
                maxLoopsTestRedim = 25,
                sampleFCalcIn = qs(".line-year .date", bodyGraphYear),
                sampleFCalcOut = qs("p", sampleFCalcIn);



            resizeGraphContainerMode();







            (function(){
                var allLines = qsa(".graph_1-line", scrollArea),
                    datesWidth = equalizeWidths(".date", allLines),
                    paymentsWidth = equalizeWidths(".payment", allLines),
                    labelsRefundWidth = equalizeWidths(".refund p", allLines),
                    labelsInterestsWidth = equalizeWidths(".interests p", allLines),
                    lineInfoWidth = datesWidth + paymentsWidth,
                    maxLoan = inRange.m[inRangeKeysM[inRangeKeysMCount - 1]].loan,
                    maxInterests = inRange.m[inRangeKeysM[0]].interests,
                    maxRatio = maxLoan / maxInterests,
                    maxRatioTotals = c.amount / (c.paymentTotal - c.amount);// Ration between column "refund" && "interests"




                var yearLines = qsa(".line-year", bodyGraphYear),
                    monthLines = qsa(".line-month", bodyGraphMonth);/*,
                        datesMonthWidth = equalizeWidths(".date", monthLines),
                        paymentsMonthWidth = equalizeWidths(".payment", monthLines),
                        labelsRefundMonthWidth = equalizeWidths(".refund p", monthLines),
                        labelsInterestsMonthWidth = equalizeWidths(".interests p", monthLines);

                    var prefix = "#graph_1 .graph_1-line.line-year ";
                    var bodyStylesheet = prefix + ".date{width:"+datesYearWidth+"px}\n"+
                        prefix + ".payment{width:"+paymentsYearWidth+"px}\n"+
                        prefix + ".refund{min-width:"+labelsRefundYearWidth+"px;flex:"+maxRatio+" 0 0}\n"+
                        prefix + ".interests{min-width:"+labelsInterestsYearWidth+"px;flex:"+"1"+" 0 0}\n";
                    prefix = "#graph_1 .graph_1-line.line-month ";
                    bodyStylesheet += prefix + ".date{width:"+datesMonthWidth+"px}\n"+
                        prefix + ".payment{width:"+paymentsMonthWidth+"px}\n"+
                        prefix + ".refund{min-width:"+labelsRefundMonthWidth+"px;flex:"+maxRatio+" 0 0}\n"+
                        prefix + ".interests{min-width:"+labelsInterestsMonthWidth+"px;flex:"+"1"+" 0 0}\n";*/

                var prefix = "#graph_1 .graph_1-line ";
                var bodyStylesheet = prefix + ".date{width:"+datesWidth+"px}\n"+
                    prefix + ".payment{width:"+paymentsWidth+"px}\n"+
                    prefix + ".refund{min-width:"+labelsRefundWidth+"px;flex:"+maxRatio+" 0 0}\n"+
                    prefix + ".interests{min-width:"+labelsInterestsWidth+"px;flex:"+"1"+" 0 0}\n";
                dynamicStylesheet.innerHTML = bodyStylesheet;

                function resizeGraphElems(e){
                    onceFlexboxInited = true;
                    headWidth = head.offsetWidth;
                    loopsTestRedim = 0;
                    var graphsWidth = headWidth - (lineInfoWidth + 40),
                        graphRight,
                        graphLeft;
                    if(maxRatio >= 1){
                        graphRight = Math.max(
                            labelsInterestsWidth,
                            graphsWidth / (maxRatio + 1)
                        );
                        graphLeft = Math.max(
                            labelsRefundWidth,
                            Math.min(
                                graphsWidth - graphRight,
                                (graphsWidth / (maxRatio + 1)) * maxRatio
                            )
                        );
                    } else {
                        graphLeft = Math.max(
                            labelsRefundWidth,
                            (graphsWidth / (maxRatio + 1)) * maxRatio
                        );
                        graphRight = Math.max(
                            labelsInterestsWidth,
                            Math.min(
                                graphsWidth - graphLeft,
                                graphsWidth / (maxRatio + 1)
                            )
                        );
                    }
                    flexRightWidth = graphRight;
                    flexLeftWidth = headWidth - flexRightWidth;
                    var containersFactor = graphLeft / graphRight,
                        eurPerPx = Math.max(maxLoan / graphLeft, maxInterests / graphRight) * 1.5,// Unit: €/px. Rescaled to avoid big huge aweful blocks
                        headLoanGraph = qs(".refund .graph-elem", head),
                        headInterestsGraph = qs(".interests .graph-elem", head);

                    headEurPerPx = Math.max(
                        c.amount / flexLeftWidth,
                        (c.paymentTotal - c.amount) / flexRightWidth
                    );

                    for(var i = 0; i < inRangeKeysMCount; i++){
                        var data = inRange.m[inRangeKeysM[i]];
                        if(!isNA(data)){
                            var line = monthLines[i],
                                loanGraph = qs(".refund .graph-elem", line),
                                interestsGraph = qs(".interests .graph-elem", line);

                            // Scale graph subelems
                            loanGraph.style.width = (data.loan / (eurPerPx)) + "px";
                            interestsGraph.style.width = (data.interests / (eurPerPx)) + "px";

                        }
                    }

                    eurPerPx = Math.max(
                        Math.max(
                            inRange.y[
                                inRangeKeysY[
                                    Math.max(
                                        inRangeKeysYCount - 1,
                                        0
                                    )
                                ]
                            ].loan,
                            inRange.y[
                                inRangeKeysY[
                                    Math.max(
                                        inRangeKeysYCount - 2,
                                        0
                                    )
                                ]
                            ].loan
                        ) / graphLeft,
                        Math.max(
                            inRange.y[
                                inRangeKeysY[
                                    Math.min(
                                        inRangeKeysYCount - 1,
                                        0
                                    )
                                ]
                            ].interests,
                            inRange.y[
                                inRangeKeysY[
                                    Math.min(
                                        inRangeKeysYCount - 1,
                                        1
                                    )
                                ]
                            ].interests
                        ) / graphRight
                    );
                    for(var i = 0; i < inRangeKeysYCount; i++){
                        var data = inRange.y[inRangeKeysY[i]];
                        if(!isNA(data)){
                            var line = yearLines[i],
                                loanGraph = qs(".refund .graph-elem", line),
                                interestsGraph = qs(".interests .graph-elem", line);

                            // Scale graph subelems
                            loanGraph.style.width = (data.loan / eurPerPx) + "px";
                            interestsGraph.style.width = (data.interests / eurPerPx) + "px";

                        }
                    }
                    setActiveLine(true);
                    // Scale out-of-table components
                    dynamicStylesheet.innerHTML = bodyStylesheet +
                        //"#graph_1 .left{min-width:" + flexLeftWidth + "px;max-width:" + flexLeftWidth + "px;width:" + flexLeftWidth + "px;}\n" +
                        "#graph_1 .right{min-width:" + flexRightWidth + "px;max-width:" + flexRightWidth + "px;width:" + flexRightWidth + "px;}\n" +
                        ""//"#graph_1-padder{min-height:" + geiN("calculator-padder").offsetHeight + "px;max-height:" + geiN("basic_data").offsetHeight + "px;height:"+docHeight()+"px;}";

                    // Resize head graph elems
                    headLoanGraph.style.width = (c.amount / headEurPerPx) + "px";
                    headInterestsGraph.style.width = ((c.paymentTotal - c.amount) / headEurPerPx) + "px";
                    resizeGraphContainerMode();



                    /*// Resize scroll cursor
                        setTimeout(function(){
                            clearInterval(intervalResizeScrollBar);
                        },500);
                        clearInterval(intervalResizeScrollBar);
                        intervalResizeScrollBar = setInterval(function(){
                            var newHeight = ((scrollArea.offsetHeight - 10) / (scrollInMaxHeight)) * (scrollLine.offsetHeight);
                            scrollCursor.style.height = newHeight + "px";
                            scrollCursor.style.top = Math.min((scrollLine.offsetHeight - 10) - newHeight, scrollCursor.offsetTop);
                        },100);*/
                    // Reposition scroll cursor
                }




                if(!resizeListenerInited){
                    resizeListenerInited = true;
                } else {
                    off(window, "resize", resizeGraphElemsPtr);
                }
                clearInterval(intervalResizeScrollBar);
                resizeGraphElemsPtr = resizeGraphElems;
                on(window, "resize", resizeGraphElemsPtr);
                go(window, "resize");
                setTimeout(function(){
                    resizeGraphContainerMode();
                },100);
            })();
        }

        function switchText(elem, newText, noAnim){
            noAnim = noAnim === true;
            function switchTextWidthOk(){
                var newWidth = newDom.offsetWidth;
                elem.classList.remove("prepare");
                elem.classList.add("doing");
                elem.style.width = newWidth + "px";
                elem.style.height = newDom.offsetHeight + "px";
                setTimeout(function(){
                    var child = elem.firstChild,
                        childNext = child.nextElementSibling;
                    while(childNext){
                        child = childNext.nextElementSibling;
                        elem.removeChild(childNext);
                        childNext = child;
                    }
                    elem.classList.remove("doing");
                    elem.style.width = "";
                }, 500);
            }

            if(isNA(elem)) {
                return;
            }
            if(noAnim){
                elem.innerHTML = "<span>" + newText + "</span>";
                return;
            }
            var newDom = parseHtml("<span>" + newText + "</span>");
            elem.style.height = elem.firstChild.offsetHeight + "px";
            elem.style.width = elem.firstChild.offsetWidth + "px";

            elem.classList.add("prepare");
            elem.insertBefore(newDom, elem.firstChild);
            waitUntil(
                switchTextWidthOk,
                function(){
                    return newDom.offsetWidth !== 0 || newText.length != 0
                },
                10,
                500
            );
        }
        w.switchText = switchText;

        var scrollCursorClickOffsetY = false;
        function doScroll(e){
            killEvent(e);
            if(scrollCursorClickOffsetY !== false){
                if(e.buttons & 1){
                    var maxTopOffset = (scrollLine.offsetHeight - scrollCursor.offsetHeight) - 10,
                        topOffset = Math.min(
                            maxTopOffset,
                            Math.max(
                                0,
                                ((e.pageY - scrollCursorClickOffsetY))
                            )
                        );
                    scrollCursor.style.top = topOffset + "px";
                    scrollContainer.style.top = "-" + ((scrollInMaxHeight[graph_1_mode] - bodyGraph.offsetHeight) * (topOffset / maxTopOffset)) + "px"
                }
            }
        }
        function endScroll(e){
            off(document, "mouseup", endScroll);
            if(scrollCursorClickOffsetY !== false){
                killEvent(e);
                if(!(e.buttons & 1)){
                    off(d, "mousemove", doScroll);
                    scrollCursorClickOffsetY = false;
                }
            }
        }
        on(scrollCursor, "mousedown", function(e){
            killEvent(e);
            if(e.buttons & 1){
                on(d, "mousemove", doScroll);
                scrollCursorClickOffsetY = e.pageY - scrollCursor.offsetTop;
            }
            on(document, "mouseup", endScroll);
        });
        on(scrollCursor, "contextmenu", function(e){
            killEvent(e);
            return false;
        });

        function killEvent(e){
            e.stopPropagation();
            e.preventDefault();
        }
    });
}());