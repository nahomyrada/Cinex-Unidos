let theatreId = obtenerParametroUrl('theatreId')
let auditoriumId = obtenerParametroUrl('auditoriumId')
let movieId = obtenerParametroUrl('movieId')

function obtenerParametroUrl(nombre){
    let regex = new RegExp('[?&]' + nombre + '(=([^&#]*)|&|#|$)');
    let resultados = regex.exec(window.location.href);
    if (!resultados) return null;
    if (!resultados[2]) return '';
    return decodeURIComponent(resultados[2].replace(/\+/g, ' '));
}
let showActual;
function seat_and_info_render(theatreId, auditoriumId, id){
    /* INFO */
    let title = document.getElementById('title')
    let poster = document.getElementById('posterImg')
    let info = document.getElementById('info')
    /* SEATS */
    let seat_section = document.getElementById('seat_section');
    let seatSVG = document.getElementById('svg-template').innerHTML
    showLoader()
    fetch(`https://cinexunidos-production.up.railway.app/theatres/${theatreId}/auditoriums/${auditoriumId}/showtimes/${id}`)
    .then((response) => {return response.json()})
    .then((data)=> {
        /* info */
        showActual = data;
        title.innerHTML = data.movie.name
        info.innerText = `${auditoriumId.replace('-', ' ')} | ${data.startTime} | ${data.movie.runningTime} | ${data.movie.rating} | RESERVA TUS ASIENTOS`.toUpperCase()
        poster.src = `https://cinexunidos-production.up.railway.app/${data.movie.poster}`
        /* Seats */
        for(let row in data.seats){
            const divRow = document.createElement('div')
            divRow.id = row
            seat_section.appendChild(divRow)
            data.seats[row].map((seat, index)=>{
                let actualRow = document.getElementById(row)
                const newSeat = document.createElement('div')
                if(seat === 2 || seat === 1){
                    newSeat.className = 'seat reserved'
                }else if(seat === -1){
                    newSeat.className = 'seat unavailable'
                }else{
                    newSeat.className = 'seat available'
                }
                newSeat.id= `${row}${index}`
                newSeat.innerHTML = seatSVG
                actualRow.appendChild(newSeat)
                newSeat.addEventListener('click', ()=> {
                    toggleSeatSelection(newSeat.id)
                })
            })
        }
        hideLoader()
    })
    .catch((err)=>{
        console.error(err)
    })
}

let selectedSeats = [];
let cantidadAsientos=0;
function toggleSeatSelection(seatId){
    const seatElement = document.getElementById(seatId)
    const seatIndex = selectedSeats.indexOf(seatId)
    if(seatElement.className === 'seat unavailable'){
        alert('Este asiento ya no se encuentra disponible')
    }else if(seatElement.className === 'seat reserved'){
        alert('Este asiento esta reservado en este momento')
    }else{
        if(seatIndex > -1){
            cancelSeatReservation(theatreId, auditoriumId, movieId, seatId)
                .then(() => {
                    selectedSeats.splice(seatIndex, 1);
                    seatElement.classList.remove('selected');
                    seatElement.classList.add('available');
                    //console.log('Reserva cancelada:', seatId);
                    cantidadAsientos--;
                })
                .catch((error) => {
                    console.error('Error al cancelar reserva:', error);
                });
        }else{
            reserveSeat(theatreId, auditoriumId, movieId, seatId)
                .then(() => {
                    selectedSeats.push(seatId);
                    seatElement.classList.remove('available');
                    seatElement.classList.add('selected');
                    //console.log('Asiento reservado:', seatId);
                    cantidadAsientos++;
                })
                .catch((error) => {
                    cancelSeatReservation(theatreId, auditoriumId, movieId, seatId)
                    alert('Error al reservar el asiento')
                    //console.log(`Asientos reservados: ${selectedSeats}`)
                    seatElement.classList.remove('selected');
                    seatElement.classList.add('available');
                    //console.error('Error al reservar asiento:', error);
                });
        }
    }
    console.log(selectedSeats)
}

function reserveSeat(theatreId, auditoriumId, showtimeId, seatId){
    return fetch(`https://cinexunidos-production.up.railway.app/theatres/${theatreId}/auditoriums/${auditoriumId}/showtimes/${showtimeId}/reserve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ seat: seatId })
    }).then(response => {
        if(!response.ok){
            throw new Error('No se pudo reservar el asiento.')
        }
        return response.json();
    });

}

function cancelSeatReservation(theatreId, auditoriumId, showtimeId, seatId) {
    return fetch(`https://cinexunidos-production.up.railway.app/theatres/${theatreId}/auditoriums/${auditoriumId}/showtimes/${showtimeId}/reserve`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ seat: seatId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('No se pudo cancelar la reserva del asiento.');
        }
        return response.json();
    });
}

const eventSource = new EventSource(`https://cinexunidos-production.up.railway.app/theatres/${theatreId}/auditoriums/${auditoriumId}/showtimes/${movieId}/reservation-updates`);

eventSource.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    console.log('Actualizacion de reservacion:', data);
    const { seat } = data;
    const seatElement = document.getElementById(seat);
    if (!selectedSeats.includes(seat)) {
        seatElement.classList.remove('available', 'selected');
        seatElement.classList.add('reserved');
        console.log(!selectedSeats.includes(seat))
        console.log(seat)
    }
    if(data.message === "The seat has been released."){
        seatElement.classList.remove('selected');
        seatElement.classList.add('available');
    }
});

function showLoader() {
    document.getElementById("loader").style.display = "block";
  }

function hideLoader() {
    document.getElementById("loader").style.display = "none";
  }
let botonContinuar = document.getElementById('botonContinuar');
botonContinuar.addEventListener('click', ()=> {emitirRecibo()});

let recibo = document.getElementById("myModal");
let closeButton = document.getElementsByClassName("close-button")[0];
let contenidoRecibo = document.getElementById("modal-content");

function emitirRecibo(){
    var recibo = document.getElementById("myModal");
    recibo.style.display = "block";
    contenidoRecibo.innerHTML=`
        <span class="close-button">&times;</span>
        <div id="recibo">
            <span>Reservación</span>
            <div class="movie-info-section" id="encabezadoModal">
                <div class="movie-img">
                    <img src="https://cinexunidos-production.up.railway.app/${showActual.movie.poster}" id="imagenModal" alt="Poster de la pelicula">
                </div>
                <div class="movie-info">
                    <h1 id="tituloModal">${showActual.movie.name}</h1>
                    <span id="infoModal">${auditoriumId.replace('-', ' ')} | ${showActual.startTime} | ${showActual.movie.runningTime} | ${showActual.movie.rating}</span>
                </div>
            </div>
        </div>
    `
    if (cantidadAsientos===0){
        contenidoRecibo.innerHTML+=`Aún no ha reservado asientos...`
    }else{
        contenidoRecibo.innerHTML+=`
        <h3 id="asientosTexto" >Asientos reservados</h3>
        <ol id="listaAsientos">
        </ol>
        `
        let listaAsientos = document.getElementById('listaAsientos');
        for(let i = 0 ; i<selectedSeats.length ; i++){
            listaAsientos.innerHTML+=`<li> #${i+1}: ${selectedSeats[i]}</li>`; 
        }
        contenidoRecibo.innerHTML+=`
        <div class="botonesModal">
            <button id="btnVolver">
                Volver
            </button>
            <button id="btnAceptar">
                Aceptar
            </button>
        </div>
        `
        let btnVolver = document.getElementById('btnVolver');
        let btnAceptar = document.getElementById('btnAceptar');
        btnVolver.onclick = function() {
            recibo.style.display = "none";
        }
        btnAceptar.addEventListener('click', function () {
            recibo.style.display = "none";
            history.back();
        });
    }
}

closeButton.onclick = function() {
  recibo.style.display = "none";
}
window.onclick = function(event) {
  if (event.target == recibo) {
    recibo.style.display = "none";
  }
}
window.addEventListener('load', seat_and_info_render(theatreId, auditoriumId, movieId));