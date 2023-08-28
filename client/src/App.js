import React, { useState } from 'react';
import ExpressionBox from './components/ExpressionBox';
import Table from './components/Table';
import BooleanExpression from './core/BooleanExpression';

import './App.scss';


function App() {
	const [expression, setExpression] = useState(new BooleanExpression(""));

	function onValidExpression(expression) {
		setExpression(expression);
	}

	return (
		<div className="app">
			<div className='content'>
				<div className='header'>
					<ExpressionBox onValidExpression={onValidExpression} />
				</div>
				<div className='body'>
					<Table expression={expression} />
				</div>
			</div>
		</div>
	);
}

export default App;
