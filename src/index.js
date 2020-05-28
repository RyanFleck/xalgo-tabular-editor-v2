import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import Papa from 'papaparse';
import './index.css';

/* ==================================================== */

class Sheet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            version: 'Alpha 0.0.7',
            table: [],
            tableRenderingData: {},
            hoverCellMessage: '',
            hoverCell: [],
            selectedCell: [],
        };

        this.cellClick = this.cellClick.bind(this);
        this.cellHover = this.cellHover.bind(this);
        this.getCSV = this.getCSV.bind(this);
        this.updateCell = this.updateCell.bind(this);
    }

    componentDidMount() {
        //as soon as render completes, the node will be registered.
        this.getCSV('/xa-singapore-example.csv');
    }

    getCSV(url) {
        const xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = () => {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
                const response = xmlhttp.responseText;
                Papa.parse(response, {
                    complete: function (results) {
                        console.log(results);
                    },
                });
                const table = csvToNestedArrays(response);
                this.setState({ table: table.slice() });
            }
        };
        xmlhttp.open('GET', url, true);
        xmlhttp.send();
    }

    cellClick(addr) {
        if (addr) {
            console.log(`Clicked on cell [${addr}]`);
            const group = addr[0];
            const row = addr[1];
            const cell = addr[2];
            const value = this.state.table[group][row][cell];
            console.log(`Cell has value: ${value}`);
            this.setState({
                selectedCellValue: value,
                selectedCell: addr,
            });
        }
    }

    cellHover(addr) {
        /*
        const group = addr[0];
        const row = addr[1];
        const cell = addr[2];
        */

        this.setState({
            hoverCell: addr,
        });
    }

    updateCell(content) {
        if (content && this.state.selectedCell.length > 0) {
            console.log(
                `Updating cell [ ${this.state.selectedCell} ] with content =>   ${content}`
            );
            const table = this.state.table.slice();
            const group = this.state.selectedCell[0];
            const row = this.state.selectedCell[1];
            const cell = this.state.selectedCell[2];
            table[group][row][cell] = content;
            this.setState({ table: table });
            this.cellClick(this.state.selectedCell);
        }
    }

    render() {
        return (
            <div id="xa-table">
                <FloatingCellInfo
                    hoverCell={this.state.hoverCell}
                    selectedCell={this.state.selectedCell}
                    cellValue={this.state.selectedCellValue}
                    updateCell={this.updateCell}
                ></FloatingCellInfo>
                <div id="version-info">
                    <div>{this.state.version}</div>
                </div>
                <h1>Table Editor</h1>
                {this.state.table.map((sections, s_key) => {
                    return (
                        <div key={s_key}>
                            <h3 className={'table-header'}>
                                {sections[0][0]
                                    .split('.')
                                    .map((s) => s[0].toUpperCase() + s.substr(1).toLowerCase())
                                    .join(' ') + ' Subtable'}
                            </h3>
                            <table key={s_key}>
                                <tbody>
                                    {sections.map((rowData, r_key) => {
                                        const color = tableColor(s_key);
                                        return (
                                            <Row
                                                first={r_key === 0}
                                                key={r_key}
                                                index={r_key}
                                                elem={rowData}
                                                address={[s_key, r_key]}
                                                selected={this.state.selectedCell}
                                                cellClick={this.cellClick}
                                                cellHover={this.cellHover}
                                                cellColor={color}
                                            ></Row>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}
            </div>
        );
    }
}

/* ==================================================== */

function tableColor(key) {
    const colors = ['#F8E0E0', '#F8ECE0', '#E6F8E0', '#E0ECF8', '#F2E0F7'];
    return colors[key % colors.length];
}

/* ==================================================== */

class FloatingCellInfo extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: 'Select a cell to make changes',
            initialUserMessage: 'Welcome to the Xalgorithms Rule Editor',
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ value: event.target.value });
    }

    handleSubmit(event) {
        event.preventDefault();
        this.props.updateCell(this.state.value);
    }

    componentDidUpdate(oldProps) {
        const newProps = this.props;
        if (oldProps.cellValue !== newProps.cellValue) {
            this.setState({ value: newProps.cellValue });
        }
    }

    render() {
        const cell_message_value = this.props.cellValue || 'Empty Cell';
        const cell_message_coords = this.props.selectedCell.join(', ');
        const cell_message =
            this.props.selectedCell.length > 0
                ? `Selected [ ${cell_message_coords} ] =>  ${cell_message_value}`
                : this.state.initialUserMessage;
        return (
            <div id={'cellInfo'}>
                <div id={'innerCellInfo'}>
                    <h3>Cell Information</h3>
                    <p>{cell_message}</p>
                    <form onSubmit={this.handleSubmit}>
                        <label>Value:</label>
                        <input
                            id={'value-input'}
                            type={'text'}
                            value={this.state.value}
                            onChange={this.handleChange}
                        ></input>
                        <input type="submit" value="Submit change" />
                    </form>
                    <p>Hovering over [ {this.props.hoverCell.join(', ')} ]</p>
                </div>
            </div>
        );
    }
}

FloatingCellInfo.propTypes = {
    hoverCell: PropTypes.arrayOf(PropTypes.number),
    selectedCell: PropTypes.arrayOf(PropTypes.number),
    cellValue: PropTypes.string,
    updateCell: PropTypes.func,
};

/* ==================================================== */

function Row(props) {
    /*console.log(
        `[ROW] TABLE ${props.address[0]} ROW ${props.address[1]} RENDERED: [${props.elem}]`
    );*/
    return (
        <tr key={props.index}>
            {props.elem.map((elem, c_key) => {
                const cell_address = props.address.slice();
                cell_address.push(c_key);
                const color = props.cellColor;
                if (props.first) {
                    return (
                        <Cell
                            address={cell_address}
                            selected={props.selected}
                            head={true}
                            key={c_key}
                            index={c_key}
                            elem={elem}
                            cellClick={props.cellClick}
                            cellHover={props.cellHover}
                            cellColor={color}
                        ></Cell>
                    );
                } else {
                    return (
                        <Cell
                            address={cell_address}
                            selected={props.selected}
                            head={false}
                            key={c_key}
                            index={c_key}
                            elem={elem}
                            cellClick={props.cellClick}
                            cellHover={props.cellHover}
                            cellColor={color}
                        ></Cell>
                    );
                }
            })}
        </tr>
    );
}

Row.propTypes = {
    index: PropTypes.number,
    elem: PropTypes.arrayOf(PropTypes.string),
    first: PropTypes.bool,
    address: PropTypes.arrayOf(PropTypes.number),
    selected: PropTypes.arrayOf(PropTypes.number),
    cellClick: PropTypes.func,
    cellHover: PropTypes.func,
    cellColor: PropTypes.string,
};

/* ==================================================== */

class Cell extends React.Component {
    render() {
        //console.log(`[CELL] Cell [${props.address}] rendered.`);
        const addr = this.props.address;
        const sel = this.props.selected;
        let color = this.props.cellColor;
        if (addr[0] === sel[0]) {
            if (addr[1] === sel[1]) {
                if (addr[2] === sel[2]) {
                    console.log(`WOOO! I AM SELECTED! color:${color}`);
                    color = genSelectColor(color);
                }
            }
        }
        if (this.props.head) {
            return (
                <th
                    onClick={() => this.props.cellClick(this.props.address)}
                    onMouseOver={() => this.props.cellHover(this.props.address)}
                    index={this.props.index}
                    style={{ background: color }}
                >
                    {this.props.elem}
                </th>
            );
        } else {
            return (
                <td
                    onClick={() => this.props.cellClick(this.props.address)}
                    onMouseOver={() => this.props.cellHover(this.props.address)}
                    index={this.props.index}
                    style={{ background: color }}
                >
                    {this.props.elem}
                </td>
            );
        }
    }
}

Cell.propTypes = {
    index: PropTypes.number,
    elem: PropTypes.string,
    cellColor: PropTypes.string,
    address: PropTypes.arrayOf(PropTypes.number),
    selected: PropTypes.arrayOf(PropTypes.number),
    cellClick: PropTypes.func,
    cellHover: PropTypes.func,
    head: PropTypes.bool,
};

/* ==================================================== */

function csvToNestedArrays(csvText) {
    const csvWithRegularNewlines = csvText.replace(/(\r\n|\n|\r)/gm, '\n');
    const csvRows = csvWithRegularNewlines.split('\n');

    const groupedRows = [];
    // Group into sections:
    csvRows.forEach((row) => {
        if (row.startsWith('METADATA.') || row.startsWith('INPUT.') || row.startsWith('OUTPUT.')) {
            groupedRows.push([]);
        }
        groupedRows[groupedRows.length - 1].push(rowSplit(row));
    });

    return groupedRows;
}

function rowSplit(row) {
    const rowCells = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    /*
    // Remove empty cells at end of row.
    let len = rowCells.length - 1;
    while (rowCells[len] == '') {
        rowCells.pop();
        len = rowCells.length - 1;
    }
    */
    return rowCells;
}

function genSelectColor(originalColor) {
    const hexStr = originalColor.substr(1);
    const newVal = parseInt(hexStr, 16) - 2236962; //parseInt('222222', 16);
    return `#${newVal.toString(16)}`;
}

/* ==================================================== */
/* ==================================================== */
/* ==================================================== */
/* ==================================================== */
/* ==================================================== */

class Page extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            table: {},
        };

        this.replaceTableData = this.replaceTableData.bind(this);
    }

    replaceTableData(newTableData) {
        console.log(newTableData);
        this.setState({ table: newTableData });
    }

    render() {
        const table_loaded = Object.keys(this.state.table).length !== 0;
        const rst = 'Reset XTE Editor';
        return (
            <div>
                <h1>XTE</h1>
                <p>Xalgorithms Tabular Editor</p>
                <Greeting tableLoaded={!table_loaded} />
                {!table_loaded ? <UseSampleCSV saveTable={this.replaceTableData} /> : null}
                {!table_loaded ? <LoadUserCSV saveTable={this.replaceTableData} /> : null}
                {table_loaded ? <SaveEditedCSV table={this.state.table} /> : null}
                {table_loaded ? (
                    <button onClick={() => this.setState({ table: {} })}>{rst}</button>
                ) : null}
                {this.state.table.data
                    ? this.state.table.data.map((value, key) => <p key={key}>{value}</p>)
                    : null}
            </div>
        );
    }
}

/* ==================================================== */

class UseSampleCSV extends React.Component {
    constructor(props) {
        super(props);
        this.click = this.click.bind(this);
    }

    click() {
        Papa.parse('/xa-singapore-example.csv', {
            download: true,
            complete: (results) => {
                this.props.saveTable(results);
            },
        });
    }

    render() {
        return <button onClick={this.click}>Use Sample Rule</button>;
    }
}

/* ==================================================== */

class SaveEditedCSV extends React.Component {
    constructor(props) {
        super(props);

        this.click = this.click.bind(this);
    }

    click() {
        console.log('SaveCSV');
    }

    handleFile(event) {
        Papa.parse(event.target.files[0], {
            complete: (results) => {
                this.props.saveTable(results);
            },
        });
    }

    render() {
        return <button onClick={this.click}>Download Modified File</button>;
    }
}

/* ==================================================== */

class LoadUserCSV extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showUploadButton: false,
        };

        this.click = this.click.bind(this);
        this.handleFile = this.handleFile.bind(this);
    }

    click() {
        console.log('LoadUserCSV');
        this.setState({ showUploadButton: true });
    }

    handleFile(event) {
        Papa.parse(event.target.files[0], {
            complete: (results) => {
                this.props.saveTable(results);
            },
        });
    }

    render() {
        const text = 'Load Rule (*.rule.csv)';
        if (this.state.showUploadButton) {
            return <input id={'file'} type={'file'} onChange={this.handleFile} required></input>;
        } else {
            return <button onClick={this.click}>{text}</button>;
        }
    }
}

/* ==================================================== */

function Greeting(props) {
    if (props.tableLoaded) {
        return (
            <p>
                <b>{'Usage: '}</b>
                {'Please load a table with one of the two buttons below.'}
            </p>
        );
    }
    return <p>Enjoy editing.</p>;
}

/* ==================================================== */

ReactDOM.render(<Page />, document.getElementById('root'));
