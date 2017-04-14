import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import { INPUT_SELECTOR } from "../constants";
import { ucfirst } from "../lib/formatting";

class SettingsList extends PureComponent {
	constructor(props) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.showAddForm = this.showAddForm.bind(this);

		this.state = {
			selectedItem: null,
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

	handleClick(item) {
		const { onSelect } = this.props;

		if (onSelect) {
			this.setState({ selectedItem: item });
			onSelect(item);
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

	renderAddButton() {
		const { itemKindName } = this.props;
		return (
			<div className="settings__list-buttons">
				<button onClick={this.showAddForm}>Add { itemKindName }</button>
			</div>
		);
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
		const { extraColumn, itemKindName, list, onAdd, onRemove, onSelect } = this.props;
		const { selectedItem, showingAddForm } = this.state;

		const adder = showingAddForm
					? this.renderAddForm()
					: this.renderAddButton();

		const itemClassName = (item) => {
			return "settings__list-item" + (
				item === selectedItem
					? " settings__list-item--selected"
					: ""
			);
		};

		const className = "settings__list" + (
			onSelect ? " settings__list--selectable" : ""
		);

		return (
			<div className={className} key="main">
				{ typeof onAdd === "function" ? adder : null }
				<ul>
					{
						list.map((item, i) => (
							<li className={itemClassName(item)} key={i}
								onClick={() => this.handleClick(item)}>
								<strong>{ item.name || item }</strong>
								{
									(typeof extraColumn === "function")
									? extraColumn(item)
									: null
								}
								{
									(typeof onRemove === "function")
									? (
										<button onClick={(evt) => onRemove(item, evt)}>
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
	onRemove: PropTypes.func,
	onSelect: PropTypes.func
};

export default SettingsList;
