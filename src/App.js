import React, {Component, useState, useEffect} from "react"
import './App.css'
import Button from 'react-bootstrap/Button';
import {getWeb3} from "./getWeb3";
import Navbar from 'react-bootstrap/Navbar';
import { useTable } from 'react-table';
import map from "./artifacts/deployments/map.json"
import {getEthereum} from "./getEthereum"
import CandidateTable from "./CandidateTable"
import bg from "./bg.jpg"
let CANDIDATES = [
    {name: 'Blake', voteCount: 2},
    {name: 'Tom', voteCount: 1}
];


class App extends Component {
     state = {
        web3: null,
        accounts: null,
        chainid: null,
        election: null,
        lastBallotId: 0,
        candidates: {},
        deadlines: {},
        
    }

 
    async getDeadline(contract, ballotId) {
        const {deadlines} = this.state
        const ballot = await contract.methods.ballots(ballotId).call()
        deadlines[ballotId] = ballot.deadline
        this.setState({ deadlines })
    }

    async getCandidates (contract, ballotId) {
        const {candidates} = this.state;
        let candidates_raw = await contract.methods.getCandidates(ballotId).call()
        let candidatesTemp = new Array();
        for (let i = 0; i < candidates_raw.length; i++) {
            candidatesTemp[i] = new Candidate(...candidates_raw[i]);
        }
        candidates[ballotId] = candidatesTemp;
        this.setState({ candidates: candidates })
        
    }

    async getAllCandidates() {
        const {lastBallotId, election} = this.state
        
    }

    componentDidMount = async () => {
        // Get network provider and web3 instance.
        const web3 = await getWeb3()

        // Try and enable accounts (connect metamask)
        try {  
            const ethereum = await getEthereum()
            ethereum.enable()
        } catch (e) {
            console.log(`Could not enable accounts. Interaction with contracts not available.
            Use a modern browser with a Web3 plugin to fix this issue.`)
            console.log(e)
        }

        // Use web3 to get the user's accounts
        const accounts = await web3.eth.getAccounts()

        // Get the current chain id
        const chainid = parseInt(await web3.eth.getChainId())

        this.setState({
            web3,
            accounts,
            chainid
        },  this.loadInitialContracts)
        

    }

    loadInitialContracts = async () => {
        if (this.state.chainid <= 3) {
            // Wrong Network!
            return
        }
	    const election = await this.loadContract(4, "Election")

        if (!election) {
            return
        }
        
        //await this.getCandidates(election, 0);

        const lastBallotId = parseInt(await election.methods.nextBallotId().call());
        console.log("This works: ", lastBallotId);
        for(let i = 0; i < lastBallotId; i++) {
            await this.getCandidates(election, i);
            await this.getDeadline(election, i)

        }
        
        
     
        this.setState({
	        election,
            lastBallotId,
        })
    }

    

    loadContract = async (chain, contractName) => {
        // Load a deployed contract instance into a web3 contract object
        const {web3} = this.state

        // Get the address of the most recent deployment from the deployment map
        let address
        try {
            address = map[chain][contractName][0]
        } catch (e) {
            console.log(`Couldn't find any deployed contract "${contractName}" on the chain "${chain}".`)
            return undefined
        }

        // Load the artifact with the specified address
        let contractArtifact
        try {
            contractArtifact = await import(`./artifacts/deployments/${chain}/${address}.json`)
        } catch (e) {
            console.log(`Failed to load contract artifact "./artifacts/deployments/${chain}/${address}.json"`)
            return undefined
        }

        return new web3.eth.Contract(contractArtifact.abi, address)
    }

    
    vote = async (ballotIndex, candidateIndex) => {
        const {accounts, election} = this.state
        await election.methods.vote(ballotIndex, candidateIndex).send({from: accounts[0]})
            .on('receipt', async () => {
                this.getCandidates(election, ballotIndex)
            })
    }

    addElection = async () => {
        const {accounts, election, lastBallotId, candidates} = this.state
        await election.methods.createBallot([]).send({from: accounts[0]})
            .on('receipt',  () => {
                candidates[lastBallotId] = []
                this.getDeadline(election, lastBallotId)
                this.setState({ candidates })
                this.setState({lastBallotId: lastBallotId+1})
            })
        
    }

    getAllElections = () => {
        const {candidates, accounts, election, lastBallotId, deadlines} = this.state
        console.log("Erection:", election)
        const tables = []
        for(let i = 0; i < lastBallotId; i++) {
            tables.push(
                <CandidateTable 
                candidates={candidates[i]}
                contract={election}
                vote={this.vote}
                id={i}
                accounts={accounts}
                getCandidates={this.getCandidates.bind(this)}
                deadline={deadlines[i]}
                />
            )
        }
        return tables
    }
    
    
    
  

    render() {
        const {
            web3, accounts, chainid, election, candidates, lastBallotId
        } = this.state


        if (!web3) {
            return <div>Loading Web3, accounts, and contracts...</div>
        }

        if (isNaN(chainid) || chainid <= 3) {
            return <div>Wrong Network! Switch to your local RPC "Localhost: 8545" in your Web3 provider (e.g. Metamask)</div>
        }

        if(!election || !candidates) {
            return <div>Contract still loading...</div>
        }
     
        let tables = this.getAllElections()
        const isAccountsUnlocked = accounts ? accounts.length > 0 : false

        return (
        <div style={{background: `url(${bg})`, paddingBottom: "100%", backgroundAttachment: "fixed"}}>
            <ul id="nav">
                <li >Election Dapp</li>
                <li class="account">Account : {accounts[0]}</li>
              </ul>
            <Button style={{backgroundColor: "green"}} onClick={async (event) => {
                event.preventDefault()
                await this.addElection()
            }}
            type="button">Add Election</Button>
             
               
                
                <div className="container" style={{
                    backgroundColor: "#98ff98",
                    marginTop: "10px",
                    width: "50%"
                    }}>
                <p>{tables}</p>
                </div>
        </div>
                

            
                
            
        )
    }
}

export default App

function Candidate(id, name, voteCount) {
    this.id = id;
    this.name = name;
    this.voteCount = voteCount;
}




