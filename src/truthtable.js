import BooleanExpression from "./booleanexpression.js";

class TruthTable {

    /** @type {BooleanExpression} */
    expression;
    /** @type {string[]} */
    propositions = [];
    /** @type {TruthTableColumn[]} */
    data = [];

    /** @param {string} expression  */
    constructor(expression) {
        this.expression = new BooleanExpression(expression);
        console.log(this.expression.parsed);
        this.propositions = this.expression.getPropositions();
        this.generatePropositionColumns();
        for (let operation of this.expression.getOperations()) {
            this.addColumn(operation.name, operation.operation);
        }
    }

    get rowsCount() {
        return Math.pow(2, this.propositions.length);
    }
    get columnsCount() {
        return this.data.length;
    }

    generatePropositionColumns() {
        for (let i = 0; i < this.propositions.length; i++) {
            const column = new TruthTableColumn(this.propositions[i]);
            for (let j = 0; j < this.rowsCount; j++) {
                const index = this.propositions.length - i;
                column.data.push(
                    j % Math.pow(2, index) >=
                    Math.pow(2, index - 1)
                );
            }
            this.data.push(column);
        }
    }

    /**
     * @param {string} name
     * @param {Operation} operation 
     */
    addColumn(name, operation) {
        const column = new TruthTableColumn(name);
        const a = this.getColumn(operation.a)?.data;
        const b = this.getColumn(operation.b)?.data;
        for (let i = 0; i < this.rowsCount; i++) {
            column.data.push(
                operation.lambda(a[i], b ? b[i] : undefined)
            );
        }
        this.data.push(column);
    }

    getColumn(name) {
        for (let i = 0; i < this.columnsCount; i++) {
            if (this.data[i].name === name) {
                return this.data[i];
            }
        }
    }

    getHTMLTable(symbols = ["0", "1"]) {
        const table = document.createElement("table");
        const header = document.createElement("tr");
        for (let i = 0; i < this.data.length; i++) {
            const th = document.createElement("th");
            th.innerText = this.data[i].name;
            header.appendChild(th);
        }
        table.appendChild(header);
        for (let i = 0; i < this.rowsCount; i++) {
            const row = document.createElement("tr");
            for (let j = 0; j < this.columnsCount; j++) {
                const td = document.createElement("td");
                td.innerText = this.data[j].data[i] ?
                    symbols[1] : symbols[0];
                row.appendChild(td);
            }
            table.appendChild(row);
        }
        return table;
    }

}

class TruthTableColumn {
    /** @type {string} */
    name;
    /** @type {boolean[]} */
    data = [];

    constructor(name) {
        this.name = name;
    }
}

export default TruthTable;
