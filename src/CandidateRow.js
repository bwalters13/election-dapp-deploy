import React, {Component} from 'react';
import Button from 'react-bootstrap/Button';

export default class CandidateRow extends Component {

    vote = this.props.vote
    render() {
        const candidate = this.props.candidate;
        return (
            <tr>
            <td>{candidate.name}</td>
            <td>{candidate.voteCount}</td>
            <td><Button 
            onClick={(event)=> {
                event.preventDefault()
                this.vote(this.props.id, candidate.id)
            }}
            type="button">
                Vote For {candidate.name}
                </Button>
            </td>
            </tr>
        );
    }
}
