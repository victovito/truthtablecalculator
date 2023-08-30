import React, { useState } from 'react';
import { ReactSVG } from 'react-svg';
import Latex from "react-latex";
import BooleanExpression, { BooleanExpressionValidation } from '../core/BooleanExpression';

import enter from './../assets/svg/Arrow previous 2.svg';
import './ExpressionBox.scss';

function ExpressionBox({ onValidExpression }) {
    const [expression, setExpression] = useState(new BooleanExpression(""));
    const [validation, setValidation] = useState(new BooleanExpressionValidation(true, null));
    
    function onChange(event) {
        const newExpression = new BooleanExpression(event.target.value);
        setExpression(newExpression);
        setValidation(newExpression.validate());
        if (newExpression.expression === "") {
            onValidExpression(newExpression);
        }
    }

    function onSubmit() {
        const newValidation = expression.validate();
        if (newValidation.valid && expression.expression !== "") {
            onValidExpression(expression);
        }
        setValidation(newValidation);
    }

    function handleKeyDown(event) {
        if (event.key === "Enter") {
            onSubmit();
        }
    }

    return (
        <div className='expression-box'>
            <div className='input-area'>
                <input type='text' placeholder='Type an expression' onChange={onChange} onKeyDown={handleKeyDown} />
                <button className='icon' onClick={onSubmit}>
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