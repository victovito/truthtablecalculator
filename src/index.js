import TruthTable from "./truthtable.js";

function onChange(event) {
    const truthtable = new TruthTable(event.target.value);

    document.getElementById("root").innerHTML = "";
    document.getElementById("root")
        .appendChild(truthtable.getHTMLTable());
}

document.querySelector("input").onchange = onChange;
