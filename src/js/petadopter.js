/*******************************************************************************

    Ad Blocker Pet Adopter - a browser extension to block requests.
    Copyright (C) 2018-present Pets Add Life

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see {http://www.gnu.org/licenses/}.

    Home: https://github.com/PetsAddLife/ad-blocker-pet-adopter
*/

/******************************************************************************/
/******************************************************************************/

(function() {

'use strict';

/******************************************************************************/

var µb = µBlock;
var petfinderEndpoint = 'https://petsaddlife.org/wp-json/petsaddlife/v1/petfinder/proxy/';

/******************************************************************************/

function toDataURL(url, callback){
    var xhr = new XMLHttpRequest();
    xhr.open('get', url);
    xhr.responseType = 'blob';
    xhr.onload = function(){
      var fr = new FileReader();
    
      fr.onload = function(){
        callback(this.result);
      };
    
      fr.readAsDataURL(xhr.response); // async call
    };
    
    xhr.send();
}

/******************************************************************************/

µb.petAdopter = {
    settings: null,
    pets: [],
    nextPetIndex: 0,
    fetchNextPetQueue: [],
    fetchNextPetXhr: null,
};

/******************************************************************************/

µb.petAdopter.assign = function(settings) {
    this.settings = settings;

    // cancel fetch request
    if (this.fetchNextPetXhr) {
        var xhr = this.fetchNextPetXhr;
        this.fetchNextPetXhr = null;
        xhr.abort();
    }

    // reset pets/index
    this.pets = [];
    this.nextPetIndex = 0;

    this.processFetchNextPetQueue();
};

µb.petAdopter.getRandomPet = function(callback, options) {
    options = options || {};

    // check if space for showing pet is too small
    if ((options.width && options.width < 100) || (options.height && options.height < 100)) {
        return callback({
            type: 'too-small'
        });
    }

    if (options.width >= 1200 && options.height >= 110) {
        return toDataURL(vAPI.getURL('/web_accessible_resources/abpa/horizontal_ad.gif?secret=' + vAPI.warSecret), function(dataUrl) {
            callback({
                type: 'banner',
                imageUrl: dataUrl,
                imageMaxWidth: 1000,
                url: 'https://petsaddlife.org/get-a-pet/',
                text: 'Get a Pet',
                maxHeight: 110,
            });
        });
    }

    return this.fetchNextPet(function(pet) {
        var photo = pet._photos.pn || pet._photos.x;
        callback({
            type: 'pet',
            imageUrl: photo.$t,
            name: pet.name.$t,
            url: 'https://petsaddlife.org/pet-finder/?id=' + encodeURIComponent(pet.id.$t + '|' +  pet.shelterId.$t) + '&type=pet'
        });
    });
}

µb.petAdopter.fetchNextPet = function(callback) {
    this.fetchNextPetQueue.push({
        callback: callback
    });
    this.processFetchNextPetQueue();
}

µb.petAdopter.processFetchNextPetQueue = function() {
    var self = this;

    while(this.nextPetIndex < this.pets.length && this.fetchNextPetQueue.length > 0) {
        var data = this.fetchNextPetQueue.shift();
        data.callback(this.pets[this.nextPetIndex]);
        this.nextPetIndex++;
    }

    if (this.nextPetIndex >= this.pets.length && !this.fetchNextPetXhr) {
        // fetch up to the first 1000 pets
        var offset = (this.nextPetIndex >= 1000) ? 0 : this.nextPetIndex;

        this.fetchNextPetXhr = this.fetchPetFind({
            location: this.settings.location,
            animal: this.settings.animal,
            count: 100,
            offset: offset
        }, function(pets) {
            // check if fetch request has been cancelled already
            if (!self.fetchNextPetXhr) return;

            self.pets = self.pets.concat(pets);
            self.nextPetIndex = offset;

            if (pets.length > 0) {
                // we got some more pets, so let's reprocess the queue
                self.fetchNextPetXhr = null;
                self.processFetchNextPetQueue();
            } else if (offset > 0) {
                // we go no more pets, so let's start from the beginning
                self.pets = [];
                self.nextPetIndex = 0;
                self.fetchNextPetXhr = null;
                self.processFetchNextPetQueue();
            } else {
                // we got no pets, and we are already at beginnning, so give up
            }
        });
    }
}

/**
 * @returns {XMLHttpRequest}
 */
µb.petAdopter.fetchPetFind = function(params, callback) {
    params = Object.assign(params, {
        method: 'pet.find'
    });

    return this.fetch(params, function(response) {
        if (params.offset > 0) return callback([]);
        if (!response) return callback([]);

        var pets = (response.petfinder.pets.pet)
            ? ((response.petfinder.pets.pet instanceof Array) ? response.petfinder.pets.pet : [response.petfinder.pets.pet])
            : [];
        
        // filter out only pets with images of the right size
        pets = pets.filter(function(pet) {
            var photos = (pet.media && pet.media.photos && pet.media.photos.photo)
                ? ((pet.media.photos.photo instanceof Array) ? pet.media.photos.photo : [pet.media.photos.photo])
                : [];
            
            photos = photos.filter(function(photo) {
                return ['x', 'pn'].indexOf(photo['@size']) > -1;
            });
            
            if (photos.length < 0) return false;


            pet._photos = {};
            photos.forEach(function(photo) {
                pet._photos[photo['@size']] = photo;
            });

            return true;
        })

        callback(pets);
    });
};

/**
 * @returns {XMLHttpRequest}
 */
µb.petAdopter.fetch = function(params, callback) {
    var query = Object.keys(params)
        .filter(function(k) {
            return !!params[k];
        })
        .map(function(k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
        })
        .join('&');
    
    var url = petfinderEndpoint + '?' + query;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.addEventListener('readystatechange', function() {
        if(this.readyState !== 4) return;

        var data = null;

        if (xhr.status === 200) {
            try {
                data = JSON.parse(xhr.responseText);
            } catch(e) {
                console.error(e);
            }
        }

        callback(data);
    });
    xhr.send();

    return xhr;
}

})();

/******************************************************************************/