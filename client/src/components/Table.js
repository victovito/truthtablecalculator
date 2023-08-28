import React, { useEffect, useState } from 'react';
import TruthTable from '../core/TruthTable';
import Latex from 'react-latex';

import './Table.scss';

function Table({ expression }) {
    const [table, setTable] = useState(new TruthTable(expression));

    useEffect(() => {
        setTable(new TruthTable(expression));
    }, [expression]);

    return (
        !table.isEmpty ?
        <div className='table-container'>
            <table>
                <tbody>
                    <tr>
                        {table.getHeaders().map((data, index) => 
                            <th key={'header' + index}>
                                <Latex>{data}</Latex>
                            </th>
                        )}
                    </tr>
                    {[...Array(table.rowsCount).keys()].map(row =>
                        <tr key={'row' + row}>
                            {table.getRow(row).map((data, index) =>
                                <td key={'cell' + index}>
                                    <Latex>{"$" + (data ? "1" : "0") + "$"}</Latex>
                                </td>
                            )}
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        : <></>
    );
}

export default Table;