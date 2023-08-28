import React, { useEffect, useState } from 'react';
import { ReactSVG } from 'react-svg';
import Latex from "react-latex";
import BooleanExpression from '../core/BooleanExpression';

import enter from './../assets/svg/Arrow previous 2.svg';
import './ExpressionBox.scss';

function ExpressionBox({ onValidExpression }) {
    const [expression, setExpression] = useState(new BooleanExpression(""));
    const validation = expression.validate();

    useEffect(() => {
        if (validation.valid && expression.expression !== "") {
            onValidExpression(expression);
        }
    }, [expression, expression.expression, onValidExpression, validation.valid]);

    function onChange(event) {
        setExpression(new BooleanExpression(event.target.value));
    }

    return (
        <div className='expression-box'>
            <div className='input-area'>
                <input type='text' placeholder='Type an expression' onChange={onChange} />
                <button className='icon'>
                    <ReactSVG src={enter} />
                </button>
            </div>
            <div className='preview-area'>
                {validation.valid || expression.expression === "" ?
                    <div className='preview'>
                        <Latex>{expression.toLatex()}</Latex>
                    </div>
                    :
                    <div className='preview error'>
                        {validation.error}
                    </div>
                }
            </div>
        </div>
    );
}

export default ExpressionBox;

// https://www.geeksforgeeks.org/logic-notations-in-latex/