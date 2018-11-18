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

    var elAnimals = uDom('[name="animals"]');
    var elMessageSaved = uDom('.message.saved').nodeAt(0);
    var messageSavedTimeout = null;
    var hasFormChanged = false;

    uDom('[name="location"]')
        .val(details.petAdopter.location)
        // validate zip/postal code
        .on('input', function(e) {
            var elInput = e.target;
            var value = elInput.value.trim();
            var isValid = !value || zipCodeRegex.test(value) || postalCodeRegex.test(value);
            var message = (isValid) ? '' : 'Please enter a valid zip code or postal code.';

            elInput.setCustomValidity(message);

            hasFormChanged = true;
        });
    
    elAnimals.forEach(function(uNode) {
        var animal = uNode.attr('value');

        uNode.prop('checked', details.petAdopter.animals.indexOf(animal) > -1);

        // ensure at least one value is selected
        uNode.on('change', function(e) {
            var formData = new FormData(e.target.form);
            var animals = formData.getAll('animals');
            var isValid = animals.length > 0;
            var message = (isValid) ? '' : 'At least one animal must be selected.';
            elAnimals.nodeAt(0).setCustomValidity(message);

            hasFormChanged = true;
        });
    });

    uDom('form').on('submit', function(e) {
        e.preventDefault();
        clearTimeout(messageSavedTimeout);

        if (hasFormChanged) {
            var formData = new FormData(e.target);

            changeUserSettings('petAdopter', {
                location: formData.get('location'),
                animals: formData.getAll('animals')
            });

            // reset tracking of form changes
            hasFormChanged = false;
        }

        elMessageSaved.classList.add('active');
        messageSavedTimeout = setTimeout(function() {
            elMessageSaved.classList.remove('active');
        }, 1000);
    });
};

/******************************************************************************/

uDom.onLoad(function() {
    messaging.send('dashboard', { what: 'userSettings' }, onUserSettingsReceived);
});

/******************************************************************************/

})();
