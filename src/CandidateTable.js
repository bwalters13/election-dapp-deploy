import React, {Component} from 'react';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form'
import CandidateRow from './CandidateRow'
export default class CandidateTable extends React.Component {
    state = {
        name: "",
        date: new Date()
    }
    handleChange(event) {
        event.preventDefault()
        this.setState({ name: event.target.value});
    }

    componentDidMount() {
        this.timerID = setInterval(
          () => this.tick(),
          1000
        );
      }

    tick() {
        this.setState({
            date: new Date()
        });
    }

    getDeadline() {
        return secondsToDhms(this.props.deadline-Math.floor(this.state.date.valueOf()/1000))
    }



    vote = this.props.vote
    render() {
        const rows = []
        this.props.candidates.forEach((candidate) => {
            rows.push(
            <CandidateRow
                candidate={candidate}
                key={candidate.id}
                vote={this.vote}
                id={this.props.id}
                 />
            );
        });

        return (
            <Table striped bordered hover>
            <thead>
            <h1> Election #{this.props.id}   </h1>
            <p>Time Remaining: {this.getDeadline()}</p>
                <tr>
                <th>Name</th>
                <th>Votes</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
            <tr><td>
            <Form onSubmit={async (event) => {
                event.preventDefault()
                await this.props.contract.methods.addCandidate(this.state.name, this.props.id).send({from: this.props.accounts[0]})
                await this.props.getCandidates(this.props.contract, this.props.id)
                this.setState({ name: '' })
            }}>        
                <label>
                Add Candidate: 
                <input type="text" value={this.state.name} onChange={this.handleChange.bind(this)} />        
                </label>
                <input type="submit" value="Submit" />
            </Form>
            </td>
            </tr>
            
            
                
            </Table>
           
        );
    }
}

function secondsToDhms(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}