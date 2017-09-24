import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import { INPUT_SELECTOR } from "../constants";
import { ucfirst } from "../lib/formatting";
import { refElSetter } from "../lib/refEls";

class SettingsList extends PureComponent {
	constructor(props) {
		super(props);

		this.hideAddForms = this.hideAddForms.bind(this);
		this.onBatchSubmit = this.onBatchSubmit.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
		this.showAddForm = this.showAddForm.bind(this);
		this.showBatchAddForm = this.showBatchAddForm.bind(this);

		this.eventHandlers = new Map();

		this.els = {};
		this.setAddExtraContainer = refElSetter("addExtraContainer").bind(this);
		this.setAddForm = refElSetter("addForm").bind(this);
		this.setAddName = refElSetter("addName").bind(this);
		this.setBatchAddNames = refElSetter("batchAddNames").bind(this);

		this.state = {
			selectedItem: props.selectedItem || null,
			showingAddForm: null
		};
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.list !== this.props.list) {
			// Reset event handlers map if we have a new list
			this.eventHandlers.clear();
		}

		if (nextProps.selectedItem !== this.props.selectedItem) {
			// Respond to external changes of selected item
			this.setState({ selectedItem: nextProps.selectedItem });
		}
	}

	componentDidUpdate(prevProps, prevState) {
		const { showingAddForm } = this.state;
		const { addForm } = this.els;

		// Automatically add focus to the first input element
		// if we just started showing a form

		if (addForm && showingAddForm && !prevState.showingAddForm) {
			const input = addForm.querySelector(INPUT_SELECTOR);

			if (input) {
				input.focus();
			}
		}
	}

	createEventHandler(item) {
		return {
			click: () => this.handleClick(item),
			remove: (evt) => this.props.onRemove(item, evt)
		};
	}

	getEventHandler(item) {
		// Cache the bound event handlers

		if (!this.eventHandlers.has(item)) {
			this.eventHandlers.set(item, this.createEventHandler(item));
		}

		return this.eventHandlers.get(item);
	}

	handleClick(item) {
		const { onSelect } = this.props;

		if (onSelect) {
			this.setState({ selectedItem: item });
			onSelect(item);
		}
	}

	showAddForm() {
		this.setState({ showingAddForm: "one" });
	}

	showBatchAddForm() {
		this.setState({ showingAddForm: "batch" });
	}

	hideAddForms() {
		this.setState({ showingAddForm: null });
	}

	onSubmit(evt) {
		evt.preventDefault();

		const { extraColumnName, onAdd } = this.props;
		const { addName, addExtraContainer } = this.els;

		const name = addName.value;

		if (name) {
			if (extraColumnName && addExtraContainer) {
				const extraInput = addExtraContainer.querySelector(INPUT_SELECTOR);
				const extra = extraInput.value;

				onAdd({ name, [extraColumnName]: extra });
			}

			else {
				onAdd({ name });
			}
		}

		this.setState({ showingAddForm: null });
	}

	onBatchSubmit(evt) {
		evt.preventDefault();

		const { extraColumnDefaultValue, extraColumnName, onAdd } = this.props;
		const { batchAddNames } = this.els;

		var names = batchAddNames.value.split("\n");

		if (names && names.length) {
			var base = {};

			if (extraColumnName) {
				if (extraColumnDefaultValue) {
					base[extraColumnName] = extraColumnDefaultValue;
				}
				else {
					console.warn("Could not batch add: No default value for extra column");
					return;
				}
			}

			names.forEach((name) => {
				if (name) {
					onAdd({ ...base, name });
				}
			});
		}

		this.setState({ showingAddForm: null });
	}

	renderAddButtons() {
		const { extraColumn, extraColumnDefaultValue, itemKindName } = this.props;
		const oneButton = (
			<button onClick={this.showAddForm}>
				Add { itemKindName }
			</button>
		);

		var batchButton = null;

		if (!extraColumn || (extraColumn && extraColumnDefaultValue)) {
			batchButton = (
				<button onClick={this.showBatchAddForm}>
					Add multiple { itemKindName + "s" }
				</button>
			);
		}

		return (
			<div className="settings__list-buttons">
				{ oneButton } {" "}
				{ batchButton }
			</div>
		);
	}

	renderAddClose() {
		return (
			<a
				className="settings__add__close"
				href="javascript://"
				onClick={this.hideAddForms}>
				<img src="/img/close.svg" width="16" height="16" alt="Close" />
			</a>
		);
	}

	renderAddForm() {
		const { extraColumn, extraColumnName, itemKindName } = this.props;
		return (
			<form className="settings__add" onSubmit={this.onSubmit} key="add" ref={this.setAddForm}>
				<h3>Add { itemKindName }</h3>
				<p className="l">
					<label htmlFor="name">Name </label>
					<input type="text" name="name" id="name" ref={this.setAddName} />
				</p>
				{
					(typeof extraColumn === "function")
					? (
						<p className="l" ref={this.setAddExtraContainer}>
							<label htmlFor={extraColumnName}>{ ucfirst(extraColumnName) + " " }</label>
							{ extraColumn(null) }
						</p>
					)
					: null
				}
				<input type="submit" />
				{ this.renderAddClose() }
			</form>
		);
	}

	renderBatchAddForm() {
		const { itemKindName } = this.props;
		return (
			<form className="settings__add" onSubmit={this.onBatchSubmit} key="add" ref={this.setAddForm}>
				<h3>Add { itemKindName + "s" }</h3>
				<p className="ta">
					<label htmlFor="names">Type names here, one per line</label>
					<textarea
						name="names"
						ref={this.setBatchAddNames} />
				</p>
				<input type="submit" />
				{ this.renderAddClose() }
			</form>
		);
	}

	renderListItem(item, i) {
		const { brief, extraColumn, itemKindName, onRemove } = this.props;
		const { selectedItem } = this.state;

		const eventHandler = this.getEventHandler(item);

		const className = "settings__list-item" + (
			item === selectedItem
				? " settings__list-item--selected"
				: ""
		);

		const extra = (typeof extraColumn === "function")
			? extraColumn(item)
			: null;

		const removeText = "Remove" + (!brief ? " " + itemKindName : "");
		const removeButton = (typeof onRemove === "function")
			? (
				<button onClick={eventHandler.remove}>
					{ removeText }
				</button>
			)
			: null;

		return (
			<li
				className={className}
				key={i}
				onClick={eventHandler.click}>
				<strong>{ item.name || item }</strong>
				{ extra }
				{ removeButton }
			</li>
		);
	}

	render() {
		const { list, onAdd, onSelect } = this.props;
		const { showingAddForm } = this.state;

		var adder = null;

		if (typeof onAdd === "function") {
			if (showingAddForm === "one") {
				adder = this.renderAddForm();
			}
			else if (showingAddForm === "batch") {
				adder = this.renderBatchAddForm();
			}
			else {
				adder = this.renderAddButtons();
			}
		}

		const className = "settings__list" + (
			onSelect ? " settings__list--selectable" : ""
		);

		const listEls = list.map((item, i) => this.renderListItem(item, i));

		return (
			<div className={className} key="main">
				{ adder }
				<ul>{ listEls }</ul>
			</div>
		);
	}
}

SettingsList.propTypes = {
	brief: PropTypes.bool,
	extraColumn: PropTypes.func,
	extraColumnName: PropTypes.string,
	extraColumnDefaultValue: PropTypes.oneOfType([
		PropTypes.string, PropTypes.number
	]),
	itemKindName: PropTypes.string.isRequired,
	list: PropTypes.array.isRequired,
	onAdd: PropTypes.func,
	onRemove: PropTypes.func,
	onSelect: PropTypes.func,
	selectedItem: PropTypes.any
};

export default SettingsList;
