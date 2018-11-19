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
    settings: null
};

/******************************************************************************/

µb.petAdopter.assign = function(settings) {
    this.settings = settings;
    console.log('assign', settings);
};


µb.petAdopter.start = function() {
    console.log('start');
    //?method=pet.find&location=m2n1g9&animal=bird
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

    return toDataURL(vAPI.getURL('/web_accessible_resources/abpa/sample-dog.jpg?secret=' + vAPI.warSecret), function(dataUrl) {
        callback({
            type: 'pet',
            imageUrl: dataUrl,
            name: 'Kobe',
            url: 'https://petsaddlife.org/pet-finder/?id=42394311%7CCA2368&type=pet'
        });
    });
}

µb.petAdopter.fetch = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', details.file, true);
    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            details.code = xhr.responseText;
            tab.page.dispatchMessage('broadcast', {
                channelName: 'vAPI',
                msg: {
                    cmd: 'injectScript',
                    details: details
                }
            });
            if(typeof callback === 'function') {
                setTimeout(callback, 13);
            }
        }
    });
    xhr.send();
}

})();

/******************************************************************************/