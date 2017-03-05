import React, { PureComponent, PropTypes } from "react";

import { INPUT_SELECTOR } from "../constants";
import { ucfirst } from "../lib/formatting";

class SettingsList extends PureComponent {
	constructor(props) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.showAddForm = this.showAddForm.bind(this);

		this.state = {
			showingAddForm: false
		};
	}

	componentDidUpdate(prevProps, prevState) {
		const { showingAddForm } = this.state;
		const { addForm } = this.refs;

		// Automatically add focus to the first input element
		// if we just started showing a form

		if (addForm && showingAddForm && !prevState.showingAddForm) {
			const input = addForm.querySelector(INPUT_SELECTOR);

			if (input) {
				input.focus();
			}
		}
	}

	showAddForm() {
		this.setState({ showingAddForm: true });
	}

	onSubmit(evt) {
		evt.preventDefault();

		const { extraColumnName, onAdd } = this.props;
		const { addName, addExtraContainer } = this.refs;

		const name = addName.value;

		if (extraColumnName && addExtraContainer) {
			const extraInput = addExtraContainer.querySelector(INPUT_SELECTOR);
			const extra = extraInput.value;

			onAdd({ name, [extraColumnName]: extra });
		}

		else {
			onAdd({ name });
		}

		this.setState({ showingAddForm: false });
	}

	renderAddForm() {
		const { extraColumn, extraColumnName, itemKindName } = this.props;
		return (
			<form className="settings__add" onSubmit={this.onSubmit} key="add" ref="addForm">
				<h3>Add { itemKindName }</h3>
				<p className="l">
					<label htmlFor="name">Name </label>
					<input type="text" name="name" id="name" ref="addName" />
				</p>
				{
					(typeof extraColumn === "function")
					? (
						<p className="l" ref="addExtraContainer">
							<label htmlFor={extraColumnName}>{ ucfirst(extraColumnName) + " " }</label>
							{ extraColumn(null) }
						</p>
					)
					: null
				}
				<input type="submit" />
			</form>
		);
	}

	render() {
		const { extraColumn, itemKindName, list, onAdd, onRemove } = this.props;
		const { showingAddForm } = this.state;

		const adder = showingAddForm
					? this.renderAddForm()
					: <button onClick={this.showAddForm}>Add { itemKindName }</button>;

		return (
			<div key="main">
				{ typeof onAdd === "function" ? adder : null }
				<ul className="settings__list">
					{
						list.map((item, i) => (
							<li className="settings__list-item" key={i}>
								<strong>{ item.name || item }</strong>
								{
									(typeof extraColumn === "function")
									? extraColumn(item)
									: null
								}
								{
									(typeof onRemove === "function")
									? (
										<button onClick={() => onRemove(item)}>
											Remove { itemKindName }
										</button>
									)
									: null
								}
							</li>
						))
					}
				</ul>
			</div>
		);
	}
}

SettingsList.propTypes = {
	extraColumn: PropTypes.func,
	extraColumnName: PropTypes.string,
	itemKindName: PropTypes.string,
	list: PropTypes.array,
	onAdd: PropTypes.func,
	onRemove: PropTypes.func
};

export default SettingsList;
