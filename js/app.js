if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

const meetingRooms = ['OrangeRoom','YellowRoom'];
let accountIdx = 0;
let accounts;

web3.eth.getAccounts()
    .then(function(result) {
        accounts = result;
    });

// IF YOU MODIFY THE CONTRACT, YOU HAVE TO RE-DEPLOY IT AND THEN REPLACE THIS ABI
const abi = [{"constant":true,"inputs":[{"name":"meetingRoom","type":"uint256"},{"name":"timeSlot","type":"uint256"}],"name":"isSlotAvailable","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"meetingRoom","type":"uint256"},{"name":"timeSlots","type":"uint256[]"}],"name":"cancel","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"meetingRoom","type":"uint256"},{"name":"timeSlot","type":"uint256"}],"name":"isSlotBookedBySender","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"meetingRooms","outputs":[{"name":"name","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"meetingRoom","type":"uint256"},{"name":"timeSlots","type":"uint256[]"}],"name":"book","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"names","type":"bytes32[]"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"booker","type":"address"},{"indexed":false,"name":"meetingRoom","type":"uint256"},{"indexed":false,"name":"timeSlots","type":"uint256[]"}],"name":"Booked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"booker","type":"address"},{"indexed":false,"name":"meetingRoom","type":"uint256"},{"indexed":false,"name":"timeSlots","type":"uint256[]"}],"name":"Canceled","type":"event"}];

// YOUR CONTRACT ADDRESS HERE
const contract = new web3.eth.Contract(abi, 'CONTRACT-ADDRESS');

// Events listeners was added for example purpose only but they don't work with Web3.providers.HttpProvider
// With web3 1.0.0 it's required a Web Socket provider to listen events
contract.events.Booked(
    function(error, event){ 
        console.log('error',error); 
        console.log('event',event); 
    })
    .on('data', function(event){
        console.log(event); // same results as the optional callback above
    })
    .on('changed', function(event){
        // remove event from local database
    })
    .on('error', console.error);

contract.events.Canceled(
    function(error, event){ 
        console.log('error',error); 
    console.log('event',event); 
    })
    .on('data', function(event){
        console.log(event);
    })
    .on('changed', function(event){
        // remove event from local database
    })
    .on('error', console.error);

function setTimeSlots() {
    for (let i = 0; i < meetingRooms.length; i++) {
        for (let j = 0; j < 8; j++) {
            let $slot = $(`[data-meeting-room="${i}"]`).find(`li[data-slot="${j}"]`);
        
            contract.methods.isSlotAvailable(i, j)
                .call()
                .then(function(result) {
                    if (!result) {
                        contract.methods.isSlotBookedBySender(i, j)
                            .call({from: accounts[accountIdx]})
                            .then(function(result) {
                                let removeClass = result ? 'danger' : 'warning';
                                let addClass = result ? 'warning' : 'danger';
                                $slot.removeClass(`list-group-item-${removeClass}`).addClass(`list-group-item-${addClass}`);
                            });
                    }
                });
        }
    }
}

function cancel(meetingRoom, selectedTimeSlots) {
    contract.methods.cancel(meetingRoom, selectedTimeSlots)
       .send({from: accounts[accountIdx]})
       .then(function(result) {
           console.log('CANCEL', result);
            
           $(`.alert[data-room="${meetingRoom}"]`).removeClass('alert-danger').addClass('alert-success').text('Cancelation was successful');
            
           setTimeSlots();
       })
       .catch(function(error) {
           console.log(error.message);
            
           $(`.alert[data-room="${meetingRoom}"]`).removeClass('alert-success').addClass('alert-danger').text('There was a problem with your cancel request');        
       });
}

function book(meetingRoom, selectedTimeSlots) {
    contract.methods.book(meetingRoom, selectedTimeSlots)
        .send({from: accounts[accountIdx]})
        .then(function(result) {
            console.log('BOOK', result);
            
            $(`.alert[data-room="${meetingRoom}"]`).removeClass('alert-danger').addClass('alert-success').text('Booking was successful');
            
            setTimeSlots();
        })
        .catch(function(error) {
            console.log(error.message);
            
            $(`.alert[data-room="${meetingRoom}"]`).removeClass('alert-success').addClass('alert-danger').text('There was a problem with your booking request');        
        });
}

function unlockBtn(meetingRoom) {
    const $startTime = $(`.start-time[data-room="${meetingRoom}"]`);
    const startTimeValue = $startTime.val();
    const $endTime = $(`.end-time[data-room="${meetingRoom}"]`);
    const endTimeValue = $endTime.val();
    const $btnBook = $(`.btn[data-room="${meetingRoom}"]`);
    
    if (startTimeValue !== '' && endTimeValue !== '' && startTimeValue < endTimeValue) {
        $btnBook.prop('disabled', false);
    }
    else {
        $btnBook.prop('disabled', true);
    }
}

function getTimeSlots(meetingRoom) {
    const $startTime = $(`.start-time[data-room="${meetingRoom}"]`);
    const startTimeValue = parseInt($startTime.val());
    const $endTime = $(`.end-time[data-room="${meetingRoom}"]`);
    const endTimeValue = parseInt($endTime.val());
    
    let timeSlots = [];
    
    for (let i = startTimeValue; i < endTimeValue; i++) {
        timeSlots.push(i);
    }
    
    return timeSlots;
}

function setAccountIndex(idx) {
    accountIdx = idx;
}

$(document).ready(function() {
    setTimeSlots();
    
    $(document).on('click', '.eth-account', function(e) {
        e.preventDefault();
        const $this = $(this);
        
        $('#accountsSwitcher').text($this.text());
        setAccountIndex($this.data('account'));
        setTimeSlots();
    });
    
    $(document).on('change', '.start-time', function() {
        const $this = $(this);
        const meetingRoom = $this.data('room');
        const startTimeValue = $this.val();
        const $endSelect = $(`.end-time[data-room="${meetingRoom}"]`);
        
        if (startTimeValue !== '') {
            
            $endSelect.prop('disabled', false);
            
            const endValue = $endSelect.val();
            if (endValue <= startTimeValue) {
                $endSelect.val('');
            }
                        
            $endSelect.find('option').each(function() {
                if (this.value > startTimeValue || this.value == '') {
                    $(this).prop('disabled', false);
                }
                else {
                    $(this).prop('disabled', true);
                }
            });
        }
        else {
            $endSelect.val('').prop('disabled', true);
        }
        
        unlockBtn(meetingRoom);
    });
    
    $(document).on('change', '.end-time', function() { 
        const $this = $(this);
        const meetingRoom = $this.data('room');
        
        unlockBtn(meetingRoom);
    });
    
    $(document).on('click', '.btn[data-action="book"]', function() { 
        const $this = $(this);
        const meetingRoom = $this.data('room');
        const timeSlots = getTimeSlots(meetingRoom);
        
        book(meetingRoom, timeSlots);
    });
    
    $(document).on('click', '.btn[data-action="free"]', function() { 
        const $this = $(this);
        const meetingRoom = $this.data('room');
        const timeSlots = getTimeSlots(meetingRoom);
        
        cancel(meetingRoom, timeSlots);
    });
});
