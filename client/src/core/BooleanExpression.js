// I recommend you to not analyze the code inside this file. It might hurt your eyes.

export default class BooleanExpression {

    /** @type {string} */
    expression;
    /** @type {boolean} */
    useLatex = true;
    /** @type {string[]} */
    parsed;

    /** @param {string} expression */
    constructor(expression) {
        this.expression = expression;
        this.parsed = this.expression === "" ? [] : parseTree(tokenize(this.expression.toUpperCase()));
    }

    /** @returns {string[]} */
    getPropositions() {
        const propositions = {};
        function findPropositionRecursively(node) {
            for (let token of node) {
                if (token instanceof Array) {
                    findPropositionRecursively(token);
                }
                else if (Object.keys(symbols).indexOf(token) === -1) {
                    if (!token.match(/[01]/)) {
                        propositions[token] = true;
                    }
                }
            }
        }
        findPropositionRecursively(this.parsed);
        return Object.keys(propositions);
    }

    getOperations(useLatex = false) {
        const operations = [];
        function findOperationsRecursively(node, level) {
            for (let token of node) {
                if (token instanceof Array) {
                    findOperationsRecursively(token, level + 1);
                }
            }
            const operation = nodeToOperation(node, useLatex);
            if (operation) {
                operations.push([level, {
                    name: nodeToStringRecursively(node, useLatex),
                    operation: operation
                }]);
            }
        }
        findOperationsRecursively(this.parsed, 0);
        return operations.sort((a, b) => a[0] + b[0]).map(x => x[1]);
    }

    toLatex() {
        return "$" + nodeToStringRecursively(this.parsed, true) + "$";
    }

    toString() {
        return nodeToStringRecursively(this.parsed);
    }

    /** @returns {BooleanExpressionValidation} */
    validate() {
        return validateExpression(this.expression);
    }

}

/** @returns {Operation} */
export const AND = (a, b) => {
    return {
        lambda: (a, b) => a && b,
        a, b
    };
}
/** @returns {Operation} */
export const OR = (a, b) => {
    return {
        lambda: (a, b) => a || b,
        a, b
    };
}
/** @returns {Operation} */
export const NAND = (a, b) => {
    return {
        lambda: (a, b) => !(a && b),
        a, b
    };
}
/** @returns {Operation} */
export const NOR = (a, b) => {
    return {
        lambda: (a, b) => !(a || b),
        a, b
    };
}
/** @returns {Operation} */
export const XOR = (a, b) => {
    return {
        lambda: (a, b) => a !== b,
        a, b
    };
}
/** @returns {Operation} */
export const XNOR = (a, b) => {
    return {
        lambda: (a, b) => a === b,
        a, b
    };
}
/** @returns {Operation} */
export const IMP = (a, b) => {
    return {
        lambda: (a, b) => !a || b,
        a, b
    };
}
/** @returns {Operation} */
export const NOT = (a) => {
    return {
        lambda: (a, b) => !a,
        a, b: undefined
    };
}

const symbols = {
    "!": NOT, "<->": XNOR, "->": IMP, "&&": AND, "||": OR
};
const symbolExpectancy = {
    "[A-Z]": [2, 4, 5, 6, 7, 8],
    "(": [0, 1, 3],
    ")": [2, 4, 5, 6, 7, 8],
    "!": [0, 1, 3],
    "<->": [0, 1, 3],
    "->": [0, 1, 3],
    "&&": [0, 1, 3],
    "||": [0, 1, 3],
};

/**
 * @returns {BooleanExpressionValidation}
 * @param {string} expression
 */
function validateExpression(expression) {
    const symbols = Object.keys(symbolExpectancy);

    /** @param {string} str  */
    function symbolAtStart(str) {
        for (let symbol of symbols) {
            if (str.slice(0, 3).startsWith(symbol)) {
                return str.slice(0, symbol.length);
            }
        }
        if (str[0].match(/[a-z]/i) || str[0].match(/[01]/)) {
            return symbols[0];
        }
        return null;
    }

    let treeLevel = 0;
    let column = 0;
    let expectancy = [0, 1, 3];
    let lastIndex = -1;
    while (column < expression.length) {
        const symbol = symbolAtStart(expression.slice(column));
        const index = symbols.indexOf(symbol);
        if (symbol == null) {
            if (expression[column] === " "){
                column++;
                continue;
            } else {
                return {
                    valid: false,
                    error: `Unknown symbol '${expression[column]}' at ${column}.`
                };
            }
        }
        if (symbol === "(") treeLevel++;
        else if (symbol === ")") {
            treeLevel--;
            if (treeLevel < 0) {
                return {
                    valid: false,
                    error: `Unexpeted symbol '${expression[column]}' at ${column}.`
                };
            }
        }
        if (expectancy.indexOf(index) === -1) {
            return {
                valid: false,
                error: `Unexpeted symbol '${expression[column]}' at ${column}.`
            };
        }
        expectancy = symbolExpectancy[symbol];
        column += index === 0 ? 1 : symbol.length;
        lastIndex = index;
    }

    if ([0, 2].indexOf(lastIndex) === -1) {
        return {
            valid: false,
            error: `Unexpected expression ending.`
        };
    } else if (treeLevel > 0) {
        return {
            valid: false,
            error: `Not all open parentheses were closed.`
        };
    } else {
        return {
            valid: true,
            error: null
        };
    }
}

/** @param {string} expression */
function tokenize(expression) {
    const tokens = [];
    let normalized = expression.split(" ").join("");
    while (normalized.length > 0) {
        let isProposition = true;
        for (let symbol of ["(", ")", ...Object.keys(symbols)]) {
            if (normalized.startsWith(symbol)) {
                tokens.push(symbol);
                normalized = normalized.slice(symbol.length);
                isProposition = false;
                break;
            }
        }
        if (isProposition) {
            tokens.push(normalized[0]);
            normalized = normalized.slice(1);
        }
    }
    return tokens;
}

/** @param {string[]} tokens */
function parseTree(tokens) {
    let parsed = parseParentheses(tokens);
    parsed = parseUnary(parsed, ["!"]);
    parsed = parseBinary(parsed, ["<->", "->"]);
    parsed = parseBinary(parsed, ["&&"]);
    parsed = parseBinary(parsed, ["||"]);
    parsed = cleanUpParenthesesTree(parsed);
    return parsed;
}

/** @param {string[]} tokens */
function parseParentheses(tokens) {
    const parsed = [];
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === "(") {
            let treeLevel = 0;
            for (let j = i + 1; j < tokens.length; j++) {
                if (tokens[j] === "(") treeLevel++;
                else if (tokens[j] === ")") {
                    if (treeLevel > 0) {
                        treeLevel--;
                    } else {
                        parsed.push(parseParentheses(tokens.slice(i + 1, j)));
                        i = j;
                        break;
                    }
                }
            }
        } else {
            parsed.push(tokens[i]);
        }
    }
    return parsed;
}

/** @param {string[]} tokens */
function cleanUpParenthesesTree(tokens) {
    const result = [];
    if (tokens.length === 1) {
        if (tokens[0] instanceof Array) {
            return cleanUpParenthesesTree(tokens[0]);
        } else {
            return tokens[0];
        }
    }
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] instanceof Array) {
            result.push(cleanUpParenthesesTree(tokens[i]));
        } else {
            result.push(tokens[i]);
        }
    }
    return result;
}

/**
 * @param {string[]} tokens
 * @param {string[]} operators 
 * */
function parseUnary(tokens, operators) {
    const parsed = [];
    for (let i = 0; i < tokens.length; i++) {
        if (operators.indexOf(tokens[i]) >= 0) {
            if (tokens[i + 1] instanceof Array) {
                parsed.push([tokens[i], parseUnary(tokens[i + 1], operators)]);
                i += 1;
            } else {
                let term = [];
                for (let j = i + 1; j < tokens.length; j++) {
                    term.push(tokens[j]);
                    if (operators.indexOf(tokens[j]) === -1) {
                        break;
                    }
                }
                if (term.length > 1) {
                    parsed.push([tokens[i], parseUnary(term, operators)]);
                } else {
                    parsed.push([tokens[i], term]);
                }
                i += term.length;
            }
        } else {
            if (tokens[i] instanceof Array) {
                parsed.push(parseUnary(tokens[i], operators));
            } else {
                parsed.push(tokens[i]);
            }
        }
    }
    return parsed;
}

/**
 * @param {string[]} tokens
 * @param {string[]} operators 
 * */
function parseBinary(tokens, operators) {
    const parsed = [];
    if (tokens.length === 3 && operators.indexOf(tokens[1]) >= 0) {
        const left = tokens[0] instanceof Array ?
            parseBinary(tokens[0], operators) :
            tokens[0];
        const right = tokens[2] instanceof Array ?
            parseBinary(tokens[2], operators) :
            tokens[2];
        parsed.push(left, tokens[1], right);
        return parsed;
    }
    for (let i = 0; i < tokens.length; i++) {
        if (operators.indexOf(tokens[i]) >= 0) {
            const left = parsed[parsed.length - 1];
            const right = tokens[i + 1] instanceof Array ?
                parseBinary(tokens[i + 1], operators) :
                tokens[i + 1];
            parsed.pop();
            parsed.push(
                [left, tokens[i], right],
                ...tokens.slice(i + 2, tokens.length)
            );
            break;
        } else {
            parsed.push(tokens[i]);
        }
    }
    if (parsed.length === tokens.length) {
        return parsed;
    } else {
        return parseBinary(parsed, operators);
    }
}

function nodeToStringRecursively(node, useLatex) {
    let result = "";
    for (let token of node) {
        if (token instanceof Array) {
            if (
                Object.keys(symbols).indexOf(getNodeOperation(token)) >
                Object.keys(symbols).indexOf(getNodeOperation(node))
            ) {
                result += "(" + nodeToStringRecursively(token, useLatex) + ")";
            } else {
                result += nodeToStringRecursively(token, useLatex);
            }
        } else {
            result += convertedSymbol(token, useLatex);
        }
    }
    return result;
}

/** @type {string} */
function convertedSymbol(symbol, useLatex) {
    const updatedSymbols = useLatex ?
        ["\\neg ", "\\Leftrightarrow ", "\\Rightarrow ", "\\land ", "\\lor "] :
        ["¬", "⇔", "⇒", "∧", "∨"];
    const index = Object.keys(symbols).indexOf(symbol);
    if (index !== -1) {
        return updatedSymbols[index];
    } else {
        return symbol;
    }
}

function getNodeOperation(node) {
    for (let token of node) {
        if (Object.keys(symbols).indexOf(token) !== -1) {
            return token;
        }
    }
}

function nodeToOperation(node, useLatex) {
    let operator;
    let terms = [];
    for (let token of node) {
        if (Object.keys(symbols).indexOf(token) !== -1) {
            operator = symbols[token];
        }
        else if (token instanceof Array) {
            terms.push(nodeToStringRecursively(token, useLatex));
        } else {
            if (token.match(/[01]/)) {
                terms.push(token == "1" ? true : false);
            } else {
                terms.push(token);
            }
        }
    }
    return (
        operator ?
        operator(terms[0], terms[1]) :
        null
    );
}

/**
 * @typedef Operation
 * @prop {Function} lambda
 * @prop {string} a
 * @prop {string} b
*/

/**
 * @typedef BooleanExpressionValidation
 * @prop {boolean} valid
 * @prop {string} error
*/
