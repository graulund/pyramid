import React, { PureComponent } from "react";
import PropTypes from "prop-types";

import SettingsList from "./SettingsList.jsx";

class SettingsDetailView extends PureComponent {
	constructor(props) {
		super(props);

		this.handleSelect = this.handleSelect.bind(this);
		this.renderItemPanel = this.renderItemPanel.bind(this);

		this.state = {
			selectedItem: props.selectedItem || props.list[0]
		};
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
		let {
			itemKindName,
			list,
			onAdd,
			onRemove,
			selectedItem
		} = this.props;

		return (
			<div className="settings__detail-view">
				<SettingsList
					itemKindName={itemKindName}
					list={list}
					onAdd={onAdd}
					onRemove={onRemove}
					onSelect={this.handleSelect}
					selectedItem={selectedItem || list[0]}
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
