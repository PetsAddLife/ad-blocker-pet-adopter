/*******************************************************************************

    uBlock Origin - a browser extension to block requests.
    Copyright (C) 2014-2017 Raymond Hill

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

    Home: https://github.com/gorhill/uBlock
*/

/* global uDom */

/******************************************************************************/

(function() {

'use strict';

/******************************************************************************/

var messaging = vAPI.messaging;

/******************************************************************************/

var changeUserSettings = function(name, value) {
    messaging.send(
        'dashboard',
        {
            what: 'userSettings',
            name: name,
            value: value
        }
    );
};

/******************************************************************************/

// TODO: use data-* to declare simple settings

var onUserSettingsReceived = function(details) {
    var zipCodeRegex = /^\d{5}$/;
    var postalCodeRegex = /^[ABCEGHJ-NPRSTVXY][0-9][ABCEGHJ-NPRSTV-Z][ ]?[0-9][ABCEGHJ-NPRSTV-Z][0-9]$/i;

    uDom('[name="zip"]')
        .val(details.petAdopterLocation)
        .on('input', function(e) {
            var elInput = e.target;
            var value = elInput.value.trim();
            var isValid = !value || zipCodeRegex.test(value) || postalCodeRegex.test(value);

            if (isValid) {
                changeUserSettings('petAdopterLocation', value);
            }
        });
    
    uDom('[name="animals"]').forEach(function(uNode) {
        var animal = uNode.attr('value');

        uNode.prop('checked', details.petAdopterAnimals.indexOf(animal) > -1);

        uNode.on('change', function(e) {
            var formData = new FormData(e.target.form);
            var animals = formData.getAll('animals');

            if (animals.length < 1) {
                alert('At least one animal must be selected.');
                uNode.prop('checked', true);
            } else {
                changeUserSettings('petAdopterAnimals', animals);
            }
        });
    });
};

/******************************************************************************/

uDom.onLoad(function() {
    messaging.send('dashboard', { what: 'userSettings' }, onUserSettingsReceived);
});

/******************************************************************************/

})();
