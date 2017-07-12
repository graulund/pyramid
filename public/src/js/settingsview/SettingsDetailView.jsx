import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import SettingsList from "./SettingsList.jsx";

class SettingsDetailView extends PureComponent {
	constructor(props) {
		super(props);

		this.handleRemove = this.handleRemove.bind(this);
		this.handleSelect = this.handleSelect.bind(this);
		this.renderItemPanel = this.renderItemPanel.bind(this);

		this.state = {
			selectedItem: props.selectedItem || props.list[0]
		};
	}

	componentWillReceiveProps(nextProps) {
		let { list, selectedItem: propsSelected } = this.props;
		let { list: nextList, selectedItem: nextSelected } = nextProps;
		let { selectedItem } = this.state;

		// Was the current selected item removed? Unset.
		if (list !== nextList) {
			if (
				nextList &&
				nextList.length &&
				nextList.indexOf(selectedItem) < 0
			) {
				selectedItem = nextList[0];
				this.setState({ selectedItem });
			}

			else if (!nextList || !nextList.length) {
				selectedItem = null;
				this.setState({ selectedItem });
			}
		}

		// Respond to external changes of selected item
		if (propsSelected !== nextSelected && nextSelected !== selectedItem) {
			this.setState({ selectedItem: nextSelected });
		}
	}

	handleRemove(item, evt) {
		let { onRemove } = this.props;

		evt.stopPropagation();

		if (typeof onRemove === "function") {
			onRemove(item, evt);
		}
	}

	handleSelect(item) {
		let { onSelect } = this.props;

		this.setState({ selectedItem: item });

		if (typeof onSelect === "function") {
			onSelect(item);
		}
	}

	renderItemPanel(item, index) {
		let { renderItemPanel } = this.props;
		let { selectedItem } = this.state;

		let isSelected = item === selectedItem;
		let style = isSelected ? {} : { display: "none" };

		if (item) {
			return (
				<div className="settings__detail-item" key={index} style={style}>
					{ renderItemPanel(item, isSelected) }
				</div>
			);
		}

		return null;
	}

	render() {
		let { itemKindName, list, onAdd } = this.props;
		let { selectedItem } = this.state;

		return (
			<div className="settings__detail-view">
				<SettingsList
					brief
					itemKindName={itemKindName}
					list={list}
					onAdd={onAdd}
					onRemove={this.handleRemove}
					onSelect={this.handleSelect}
					selectedItem={selectedItem}
					key="list" />
				{ list.map(this.renderItemPanel) }
			</div>
		);
	}
}

SettingsDetailView.propTypes = {
	itemKindName: PropTypes.string.isRequired,
	list: PropTypes.array.isRequired,
	onAdd: PropTypes.func,
	onRemove: PropTypes.func,
	onSelect: PropTypes.func,
	renderItemPanel: PropTypes.func.isRequired,
	selectedItem: PropTypes.any
};

export default SettingsDetailView;
