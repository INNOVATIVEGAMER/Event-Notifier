import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Chip from "@material-ui/core/Chip";

const useStyles = makeStyles((theme) => ({
	formControl: {
		margin: theme.spacing(1),
		minWidth: 120,
		maxWidth: 300,
	},
	chips: {
		display: "flex",
		flexWrap: "wrap",
	},
	chip: {
		margin: 2,
	},
	noLabel: {
		marginTop: theme.spacing(3),
	},
}));

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
			width: 250,
		},
	},
};

// function getStyles(name, personName, theme) {
// 	return {
// 		fontWeight:
// 			personName.indexOf(name) === -1
// 				? theme.typography.fontWeightRegular
// 				: theme.typography.fontWeightMedium,
// 	};
// }

export default function MultipleSelectInput({ input, label, interest }) {
	const classes = useStyles();
	// const theme = useTheme();
	const [personName, setPersonName] = React.useState([]);

	const handleChange = (event) => {
		setPersonName(event.target.value);
	};

	// const handleChangeMultiple = (event) => {
	// 	const { options } = event.target;
	// 	const value = [];
	// 	for (let i = 0, l = options.length; i < l; i += 1) {
	// 		if (options[i].selected) {
	// 			value.push(options[i].value);
	// 		}
	// 	}
	// 	setPersonName(value);
	// };

	return (
		<FormControl className={classes.formControl}>
			<InputLabel id="demo-mutiple-chip-label">{label}</InputLabel>
			<Select
				labelId="demo-mutiple-chip-label"
				id="demo-mutiple-chip"
				multiple
				value={personName}
				onChange={handleChange}
				variant="outlined"
				input={<Input id="select-multiple-chip" />}
				renderValue={(selected) => (
					<div className={classes.chips}>
						{selected.map((value) => (
							<Chip
								key={value}
								label={value}
								className={classes.chip}
							/>
						))}
					</div>
				)}
				MenuProps={MenuProps}
			>
				{interest.map((item) => (
					<MenuItem
						key={item.key}
						value={item.value}
						//style={getStyles(name, personName, theme)}
					>
						{item.text}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}