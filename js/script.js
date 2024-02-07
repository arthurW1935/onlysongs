
async function generateAccessToken(){

    if(localStorage.access_token!=undefined && localStorage.access_token!='undefined'){
        return localStorage.access_token;
    }

    // console.log(1);
    const clientId = 'abd347443ecd45e29093fbdd39992028';
    const redirectUri = 'https://arthurw1935.github.io/onlysongs/main.html';
    const url = 'https://accounts.spotify.com/api/token';
    const urlParams = new URLSearchParams(window.location.search);
    let code = urlParams.get('code');

    if(code==null){
        window.location.href = 'https://arthurw1935.github.io/onlysongs/index.html';
        return;
    }
    const getToken = async code => {
        console.log(6);
        let codeVerifier = localStorage.getItem('code_verifier');
        
        const payload = {
            method: 'POST',
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
            client_id: clientId,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
            }),
        }   
        const body = await fetch(url, payload);
        const response =await body.json();
        
        console.log(response);
        localStorage.setItem('response', response);

        // alert("yes1"+response);
        return response.access_token;
    }
    
    let token=undefined;
    try {
        token = await getToken(code);
        // alert("yes2"+token);
    } catch (error) {
        // alert("yes3"+error);
    }
    
    localStorage.setItem('access_token', token);
    window.history.replaceState({}, document.title, "onlysongs/main.html");
    return token;
}
 
async function currentTrack(token, device_id){
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }).then(response => response.json()).catch(err => console.log(err));

    console.log(response.device);

    let name = document.querySelector('.now-playing-details h3');
    name.innerHTML = response.item.name;
    let artist = document.querySelector('.now-playing-details p');
    artist.innerHTML = response.item.artists.map(artist => artist.name).join(', ');
    let albumCover = document.querySelector('.now-playing-image img')
    albumCover.src = response.item.album.images[0].url;
}

async function getQueue(token, device_id){
    const response = await fetch('https://api.spotify.com/v1/me/player/queue', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
    }).then(response => response.json());

    console.log(response);

    let queue = response.queue;
    console.log(queue);
    let listOfTracks = document.getElementsByClassName('song-list')[0];
    listOfTracks.innerHTML = '';
    for(n in queue){
        let tracks = queue[n];
        let name = tracks.name;
        let artist = tracks.artists.map(artist => artist.name).join(', ');

        let track = document.createElement('div');
        track.className = 'song-list-item';
        track.innerHTML = `
        <div class="song-detail">
            <h6>${name}</h6>
            <p>${artist}</p>
        </div>
        <button class="play" index=${n} uri='${tracks.uri}'>
            <i class="fa-solid fa-circle-play" index=${n} uri='${tracks.uri}'></i>
        </button>`;
        track.getElementsByClassName('play')[0].addEventListener('click', async function(e){
            console.log('play');
            console.log(e.target);
            await fetch('https://api.spotify.com/v1/me/player/play?device_id=' + device_id, {
                    method: 'PUT',
                    body: JSON.stringify(
                        {
                            "uris":[e.target.getAttribute('uri')],
                            "position_ms": 0
                        }
                    ),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
            })

            document.getElementsByClassName('play-button')[0].style.display = 'none';
            document.getElementsByClassName('pause-button')[0].style.display = 'block';
            await getQueue(token, device_id);
            await currentTrack(token, device_id);
        });
        listOfTracks.appendChild(track);
    }
}

async function setRepeatMode(){
    const token = localStorage.getItem('access_token');
    const device_id = localStorage.getItem('device_id');
    const response = await fetch('https://api.spotify.com/v1/me/player/repeat?state=context&device_id=' + device_id, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
    }).then(response => response.json());

    console.log(response);
}

async function searchSongs(query){
    const token = localStorage.getItem('access_token');
    const device_id = localStorage.getItem('device_id');
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&market=US&limit=10`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
    }).then(response => response.json());

    let tracks = response.tracks.items;
    let searchResultContainer = document.getElementsByClassName('search-result-container')[0];
    searchResultContainer.innerHTML = '';
    for (track in tracks){
        let searchItem = document.createElement('div');
        searchItem.className = "search-result song-list-item";
        searchItem.innerHTML= `
                    <div class="song-detail">
                        <h6>${tracks[track].name}</h6>
                        <p>${tracks[track].artists.map(artist => artist.name).join(', ')}</p>
                    </div>
                    <button class="play" index='${track} uri=${(tracks[track].uri).replace(/:/g, '%3A')}'>
                        <i class="fa fa-plus" index=${track} uri=${(tracks[track].uri).replace(/:/g, '%3A')}></i>
                    </button>`
        let addSong = searchItem.getElementsByTagName('button')[0];
        async function addToQueue(device_id, xuri, token) {
            const url = 'https://api.spotify.com/v1/me/player/queue?device_id='+device_id+'&uri='+xuri;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            };
            try {
                const response = await fetch(url, { method: 'POST', headers: headers });
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }
                // const data = await response.json();
                // console.log(data);
            } catch (error) {
                console.error('Error:', error);
            }
        }
        addSong.addEventListener('click', async (e)=>{
            let xuri = e.target.getAttribute('uri');
            console.log(xuri);
            // for(let i=0; i<10; i++){
            let res = await addToQueue(device_id, xuri, token).then(resp => resp.json()).catch(err => console.log(err));
            await getQueue(token, device_id);
        });
        searchResultContainer.appendChild(searchItem);
    }

    console.log(response);
}

window.onSpotifyWebPlaybackSDKReady = async function (){
    console.log('ready');
    var token = await generateAccessToken();
    
    console.log(token);

    const playButton = document.getElementsByClassName('play-button')[0];
    const pauseButton = document.getElementsByClassName('pause-button')[0];
    const searchBar = document.querySelector('.search-popup-body input');
    const addButton = document.querySelector('.add-song');
    const closeButton = document.querySelector('.close-button');

    const player = new Spotify.Player({
        name: 'onlysongs',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });
    
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        fetch ('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
            },
            body: JSON.stringify({
                "device_ids": [device_id],
            })
        });

        localStorage.setItem('device_id', device_id);
        getQueue(token, device_id);

        playButton.addEventListener('click', async function(){
            console.log('play');
            player.resume();
            playButton.style.display = 'none';
            pauseButton.style.display = 'block';
        });

        pauseButton.addEventListener('click', async function(){
            console.log('pause');
            player.pause();
            playButton.style.display = 'block';
            pauseButton.style.display = 'none';
        });

        addButton.addEventListener('click', ()=>{
            console.log('add');
            document.querySelector('.search-popup').style.display = 'flex';
        });

        closeButton.addEventListener('click', ()=>{
            console.log('close');
            document.querySelector('.search-popup').style.display = 'none';
        });

        searchBar.addEventListener('keyup', async function(e){    
            console.log(e.target.value);
            if(e.target.value.length>2) searchSongs(e.target.value);
        });

        setRepeatMode();

    });

    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
    });

    player.addListener('initialization_error', ({ message }) => {
        console.error(message);
    });

    player.addListener('authentication_error', ({ message }) => {
        console.error(message);
    });

    player.addListener('account_error', ({ message }) => {
        console.error(message);
    });

    player.addListener('player_state_changed', ({
        position,
        duration,
        track_window: { current_track }
        }) => {
        console.log('Currently Playing', current_track);
        console.log('Position in Song', position);
        console.log('Duration of Song', duration);

        let device_id = localStorage.getItem('device_id');
        currentTrack(token, device_id);
        getQueue(token, device_id);
    });
    
    await player.connect();
}



