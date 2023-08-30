import BooleanExpression from "./BooleanExpression";

class TruthTable {

    /** @type {BooleanExpression} */
    expression;
    /** @type {string[]} */
    propositions = [];
    /** @type {TruthTableColumn[]} */
    data = [];

    /** @type {boolean} */
    useLatex = true;

    /** @param {BooleanExpression | string} expression  */
    constructor(expression) {
        if (expression instanceof BooleanExpression) {
            this.expression = expression;
        } else {
            this.expression = new BooleanExpression(expression);
        }
        this.propositions = this.expression.getPropositions();
        this.generatePropositionColumns();
        for (let operation of this.expression.getOperations(this.useLatex)) {
            this.addColumn(operation.name, operation.operation);
        }
    }

    get isEmpty() {
        return this.columnsCount === 0;
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
        const isbool = val => val === false || val === true;
        if (this.getColumn(name)) return;
        const column = new TruthTableColumn(name);
        const a = isbool(operation.a) ? operation.a : this.getColumn(operation.a)?.data;
        const b = isbool(operation.b) ? operation.b : this.getColumn(operation.b)?.data;
        for (let i = 0; i < this.rowsCount; i++) {
            column.data.push(
                operation.lambda(
                    isbool(a) ? a : a[i],
                    isbool(b) ? b : (b ? b[i] : undefined)
                )
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

    getHeaders() {
        const data = [];
        for (let i = 0; i < this.columnsCount; i++) {
            if (this.useLatex) {
                data.push(`$${this.data[i].name}$`);
            } else {
                data.push(this.data[i].name);
            }
        }
        return data;
    }

    getRow(rowIndex) {
        const data = [];
        for (let i = 0; i < this.columnsCount; i++) {
            data.push(this.data[i].data[rowIndex]);
        }
        return data;
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
