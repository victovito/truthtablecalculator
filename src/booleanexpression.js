export default class BooleanExpression {

    /** @type {string} */
    expression;

    /** @param {string} expression */
    constructor(expression) {
        this.expression = expression;
    }

    get parsed() {
        return parseTree(tokenize(this.expression));
    }

    /** @returns {string[]} */
    getPropositions() {
        const propositions = {};
        function findPropositionRecursively(node) {
            for (let token of node) {
                if (token instanceof Array) {
                    findPropositionRecursively(token);
                }
                else if (Object.keys(symbols).indexOf(token) == -1) {
                    propositions[token] = true;
                }
            }
        }
        findPropositionRecursively(this.parsed);
        return Object.keys(propositions);
    }

    /** @returns {Operation[]} */
    getOperations() {
        const operations = [];
        function findOperationsRecursively(node, level) {
            for (let token of node) {
                if (token instanceof Array) {
                    findOperationsRecursively(token, level + 1);
                }
            }
            const operation = nodeToOperation(node);
            if (operation) {
                operations.push([level, {
                    name: nodeToStringRecursively(node),
                    operation: operation
                }]);
            }
        }
        findOperationsRecursively(this.parsed, 0);
        return (operations.sort().reverse()).map(x => x[1]);
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
        lambda: (a, b) => a != b,
        a, b
    };
}
/** @returns {Operation} */
export const XNOR = (a, b) => {
    return {
        lambda: (a, b) => a == b,
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

/**
 * @param {string[]} tokens
 * @param {string[]} operators 
 * */
function parseUnary(tokens, operators) {
    const parsed = [];
    if (tokens.length == 2) {
        const term = tokens[1] instanceof Array ?
            parseUnary(tokens[1], operators) :
            tokens[1];
        parsed.push(tokens[0], term);
        return parsed;
    }
    for (let i = 0; i < tokens.length; i++) {
        if (operators.indexOf(tokens[i]) >= 0) {
            const term = tokens[i + 1] instanceof Array ?
                parseUnary(tokens[i + 1], operators) :
                tokens[i + 1];
            parsed.push([tokens[i], term]);
            i += 1;
        } else {
            parsed.push(tokens[i]);
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
    if (tokens.length == 3 && operators.indexOf(tokens[1]) >= 0) {
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
    if (parsed.length == tokens.length) {
        return parsed;
    } else {
        return parseBinary(parsed, operators);
    }
}

function nodeToStringRecursively(node) {
    let result = "";
    for (let token of node) {
        if (token instanceof Array) {
            result += "(" + nodeToStringRecursively(token) + ") ";
        } else {
            result += token + (token == "!" ? "" : " ");
        }
    }
    return result.slice(0, result.length - 1);
}

function nodeToOperation(node) {
    let operator;
    let terms = [];
    for (let token of node) {
        const operatorIndex = Object.keys(symbols).indexOf(token);
        if (Object.keys(symbols).indexOf(token) != -1) {
            operator = symbols[token];
        }
        else if (token instanceof Array) {
            terms.push(nodeToStringRecursively(token));
        } else {
            terms.push(token);
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
