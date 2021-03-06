/**
 * jquery.multi-select-all.js
 * Original work by mySociety
 * https://github.com/mysociety/jquery-multi-select
 * 
 * This logic was forked in order to be able to add an "All" option that can be passed when instantiated as well as an 
 * "onClose" callback function for whne the selection's menu listing is closed. If your multi-select element has an option 
 * to select all, you can set the "allOptionValue" to the string value of this option. 
 * 
 * When selecting this "All" option, all other options will be deselected. Upon selecting another option, the "All"
 * option will be deselected.
 * 
    For example:

    $('select').multiSelect({
        allOptionValue: "All",
        onClose: function() {
            alert("Menu closed!")
        }
    });
 */



;(function($) {

    "use strict";

    var pluginName = "multiSelect",
        defaults = {
            'containerHTML': '<div class="multi-select-container">',
            'menuHTML': '<div class="multi-select-menu">',
            'buttonHTML': '<span class="multi-select-button">',
            'menuItemsHTML': '<div class="multi-select-menuitems">',
            'menuItemHTML': '<label class="multi-select-menuitem">',
            'presetsHTML': '<div class="multi-select-presets">',
            'modalHTML': undefined,
            'menuItemTitleClass': 'multi-select-menuitem--titled',
            'activeClass': 'multi-select-container--open',
            'noneText': '-- Select --',
            'allText': undefined,
            'presets': undefined,
            'positionedMenuClass': 'multi-select-container--positioned',
            'positionMenuWithin': undefined,
            'viewportBottomGutter': 20,
            'menuMinHeight': 200,
            'allOptionValue': undefined,
            'onClose': undefined
    },
    dataAttrName = "multiselect_" + Math.floor(Math.random() * 10001), // Used to identify the current instance in case we need to reload.
    itemsLoadState = undefined,
    itemsCloseState = undefined;

    /**
     * @constructor
     */
    function MultiSelect(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    function arraysAreEqual(array1, array2) {
        if ( array1.length != array2.length ){
            return false;
        }
    
        array1.sort();
        array2.sort();
    
        for ( var i = 0; i < array1.length; i++ ){
            if ( array1[i] !== array2[i] ){
            return false;
            }
        }
    
        return true;
    }

    $.extend(MultiSelect.prototype, {
  
        init: function() {
            this.checkSuitableInput();
            this.findLabels();
            this.constructContainer();
            this.constructButton();
            this.constructMenu();
            this.constructModal();
    
            this.setUpBodyClickListener();
            this.setUpLabelsClickListener();
    
            this.$element.hide();
        },
    
        checkSuitableInput: function(text) {
            if (this.$element.is('select[multiple]') === false) {
                throw new Error('$.multiSelect only works on <select multiple> elements');
            }
        },
    
        findLabels: function() {
            this.$labels = $('label[for="' + this.$element.attr('id') + '"]');
        },
    
        constructContainer: function() {
            this.$container = $(this.settings['containerHTML']);
            
            // Set the attribute which will contain the instance name for reloading
            this.$container.attr("data-instance", dataAttrName)
            
            this.$element.data('multi-select-container', this.$container);
            this.$container.insertAfter(this.$element);
            this.$menuItems = $(this.settings['menuItemsHTML']);
        },
    
        constructButton: function() {
            var _this = this;
            this.$button = $(this.settings['buttonHTML']);
            this.$button.attr({
                'role': 'button',
                'aria-haspopup': 'true',
                'tabindex': 0,
                'aria-label': this.$labels.eq(0).text()
            })
            .on('keydown.multiselect', function(e) {
                var key = e.which;
                var returnKey = 13;
                var escapeKey = 27;
                var spaceKey = 32;
                var downArrow = 40;

                if ((key === returnKey) || (key === spaceKey)) {
                    e.preventDefault();
                    _this.$button.click();
                } else if (key === downArrow) {
                    e.preventDefault();
                    _this.menuShow();
                    var group = _this.$presets || _this.$menuItems;
                    group.children(":first").focus();
                } else if (key === escapeKey) {
                    _this.menuHide();
                }
            }).on('click.multiselect', function(e) {
                _this.menuToggle();
            })
            .appendTo(this.$container);
    
            this.$element.on('change.multiselect', function(e) {
                // Update the button contents. Pass the value of option that was clicked so we can check if it is the "All" option text.
                _this.updateButtonContents(e.target.text);
            });
    
            this.updateButtonContents();
        },
    
        updateButtonContents: function(optionText) {
            var _this = this;
            var options = [];
            var selected = [];
    
            // Loop through all the select's options and add their text to our list of selected options to display to the user
            this.$element.find('option').each(function() {
                var text = ($(this).text());
                options.push(text);

                // If the current option is selected and is not the "All" option, add to the list to display to the end user
                if ($(this).is(':selected') && text != _this.settings['allOptionValue']) {
                    selected.push($.trim(text));
                }
            });
    
            // Clear out the options that are displayed in the select box
            this.$button.empty();
    
            if (selected.length == 0) {
                // Nothing has been selected so show the default "none" text
                this.$button.text( this.settings['noneText'] );
            } else if ( (selected.length === options.length) && this.settings['allText']) {
                // Everything is selected so show the "all" text
                this.$button.text( this.settings['allText'] );
            } else {
                // Check if the option that was just selected was the "All" option
                if (
                    typeof this.settings['allOptionValue'] != "undefined" 
                    && optionText === this.settings['allOptionValue']
                ) {
                    // Loop through all the options that are not the "All" option that was just selected and unselect them
                    this.$element.find('option').each(function() {
                        if ($(this).text() != optionText) {
                            $(this).prop("selected", false);
                        }
                    });

                    // Clear out the select's list of selected option and replace with either the plugin's "allText" option or if not set, 
                    // the text of the option that was just seledcted
                    this.$button.empty();
                    this.$button.text(this.settings['allText'] || optionText);

                    // The options of the original select box has been updated. Now we need to update the UI that was created by this plugin.
                    _this.updateMenuItems();
                } else {
                    // The option that was just selected is not the "All" option. Uncheck the "All" option.
                    this.$element.find('option').each(function() {
                        if ($(this).text() == _this.settings['allOptionValue']) {
                            $(this).prop("selected", false);
                        }
                    });

                    // The options of the original select box has been updated. Now we need to update the UI that was created by this plugin.
                    _this.updateMenuItems();

                    // Display the list of selected options to the end user separated by commas
                    this.$button.text( selected.join(', ') );
                }
            }
        },
    
        constructMenu: function() {
            var _this = this;
    
            this.$menu = $(this.settings['menuHTML']);

            this.$menu.attr({
                'role': 'menu'
            }).on('keyup.multiselect', function(e){
                var key = e.which;
                var escapeKey = 27;
                if (key === escapeKey) {
                    _this.menuHide();
                    _this.$button.focus();
                }
            })
            .appendTo(this.$container);
    
            this.constructMenuItems();
    
            if (this.settings['presets']) {
                this.constructPresets();
            }
        },
    
        constructMenuItems: function() {
            var _this = this;

            this.$menu.append(this.$menuItems);
    
            this.$element.on('change.multiselect', function(e, internal) {
                // Don't need to update the menu items if this
                // change event was fired by our tickbox handler.
                if(internal !== true){
                    _this.updateMenuItems();
                }
            });
    
            this.updateMenuItems();
        },

        updateItemsState: function(onOpen) {
            var _this = this;

            var elementState = [];

            this.$element.children('optgroup,option').each(function(index, element) {
                var $item;
                if (element.nodeName === 'OPTION') {
                    $item = _this.constructMenuItem($(element), index);

                    elementState.push($item[0].childNodes[0].checked);                    
                }
            });

            if (onOpen) {
                _this.itemsLoadState = elementState;
            } else {
                _this.itemsCloseState = elementState
            }
        },

        updateMenuItems: function() {
            var _this = this;
            this.$menuItems.empty();
    
            this.$element.children('optgroup,option').each(function(index, element) {
                var $item;
                if (element.nodeName === 'OPTION') {
                    $item = _this.constructMenuItem($(element), index);
                    _this.$menuItems.append($item);
                } else {
                    _this.constructMenuItemsGroup($(element), index);
                }
            });
        },
    
        upDown: function(type, e) {
        var key = e.which;
        var upArrow = 38;
        var downArrow = 40;
    
        if (key === upArrow) {
            e.preventDefault();

            var prev = $(e.currentTarget).prev();

            if (prev.length) {
                prev.focus();
            } else if (this.$presets && type === 'menuitem') {
                this.$presets.children(':last').focus();
            } else {
                this.$button.focus();
            }
        } else if (key === downArrow) {
            e.preventDefault();

            var next = $(e.currentTarget).next();
            
            if (next.length || type === 'menuitem') {
                next.focus();
            } else {
                this.$menuItems.children(':first').focus();
            }
        }
        },
    
        constructPresets: function() {
            var _this = this;
            this.$presets = $(this.settings['presetsHTML']);
            this.$menu.prepend(this.$presets);
    
            $.each(this.settings['presets'], function(i, preset){
                var unique_id = _this.$element.attr('name') + '_preset_' + i;
                var $item = $(_this.settings['menuItemHTML'])
                    .attr({
                        'for': unique_id,
                        'role': 'menuitem'
                    })
                    .text(' ' + preset.name)
                    .on('keydown.multiselect', _this.upDown.bind(_this, 'preset'))
                    .appendTo(_this.$presets);
        
                var $input = $('<input>')
                    .attr({
                        'type': 'radio',
                        'name': _this.$element.attr('name') + '_presets',
                        'id': unique_id
                    })
                    .prependTo($item);
        
                $input.on('change.multiselect', function(){
                    _this.$element.val(preset.options);
                    _this.$element.trigger('change');
                });
            });
    
            this.$element.on('change.multiselect', function() {
                _this.updatePresets();
            });
    
            this.updatePresets();
        },
    
        updatePresets: function() {
            var _this = this;
    
            $.each(this.settings['presets'], function(i, preset){
                var unique_id = _this.$element.attr('name') + '_preset_' + i;
                var $input = _this.$presets.find('#' + unique_id);
        
                if ( arraysAreEqual(preset.options || [], _this.$element.val() || []) ){
                    $input.prop('checked', true);
                } else {
                    $input.prop('checked', false);
                }
            });
        },
    
        constructMenuItemsGroup: function($optgroup, optgroup_index) {
            var _this = this;
    
            $optgroup.children('option').each(function(option_index, option) {
                var $item = _this.constructMenuItem($(option), optgroup_index + '_' + option_index);
                var cls = _this.settings['menuItemTitleClass'];
                
                if (option_index !== 0) {
                        cls += 'sr';
                }

                $item.addClass(cls).attr('data-group-title', $optgroup.attr('label'));
                _this.$menuItems.append($item);
            });
        },
    
        constructMenuItem: function($option, option_index) {
            var unique_id = this.$element.attr('name') + '_' + option_index;
            var $item = $(this.settings['menuItemHTML'])
                .attr({
                    'for': unique_id,
                    'role': 'menuitem'
                })
                .on('keydown.multiselect', this.upDown.bind(this, 'menuitem'))
                .text(' ' + $option.text());
    
            var $input = $('<input>')
                .attr({
                    'type': 'checkbox',
                    'id': unique_id,
                    'value': $option.val()
                })
                .prependTo($item);
    
            if ( $option.is(':disabled') ) {
                $input.attr('disabled', 'disabled');
            }
            if ( $option.is(':selected') ) {
                $input.prop('checked', 'checked');
            }
    
            $input.on('change.multiselect', function() {
                if ($(this).prop('checked')) {
                    $option.prop('selected', true);
                } else {
                    $option.prop('selected', false);
                }
        
                // .prop() on its own doesn't generate a change event.
                // Other plugins might want to do stuff onChange.
                $option.trigger('change', [true]);
            });
    
            return $item;
        },
    
        constructModal: function() {
            var _this = this;
    
            if (this.settings['modalHTML']) {
                this.$modal = $(this.settings['modalHTML']);
                
                this.$modal.on('click.multiselect', function(){
                    _this.menuHide();
                });

                this.$modal.insertBefore(this.$menu);
            }
        },
    
        setUpBodyClickListener: function() {
            var _this = this;
    
            // Hide the $menu when you click outside of it.
            $('html').on('click.multiselect', function(){
                _this.menuHide();
            });
    
            // Stop click events from inside the $button or $menu from
            // bubbling up to the body and closing the menu!
            this.$container.on('click.multiselect', function(e){
                e.stopPropagation();
            });
        },
    
        setUpLabelsClickListener: function() {
            var _this = this;

            this.$labels.on('click.multiselect', function(e) {
                e.preventDefault();
                e.stopPropagation();
                _this.menuToggle();
            });
        },
    
        menuShow: function() {
            // Get the initial items' states to compare when closing
            this.updateItemsState(true);

            $('html').trigger('click.multiselect'); // Close any other open menus
            this.$container.addClass(this.settings['activeClass']);
    
            if ( this.settings['positionMenuWithin'] && this.settings['positionMenuWithin'] instanceof $ ) {
                var menuLeftEdge = this.$menu.offset().left + this.$menu.outerWidth();
                var withinLeftEdge = this.settings['positionMenuWithin'].offset().left + this.settings['positionMenuWithin'].outerWidth();
        
                if ( menuLeftEdge > withinLeftEdge ) {
                    this.$menu.css( 'width', (withinLeftEdge - this.$menu.offset().left) );
                    this.$container.addClass(this.settings['positionedMenuClass']);
                }
            }
    
            var menuBottom = this.$menu.offset().top + this.$menu.outerHeight();
            var viewportBottom = $(window).scrollTop() + $(window).height();

            if ( menuBottom > viewportBottom - this.settings['viewportBottomGutter'] ) {
                this.$menu.css({
                    'maxHeight': Math.max(
                    viewportBottom - this.settings['viewportBottomGutter'] - this.$menu.offset().top,
                    this.settings['menuMinHeight']
                    ),
                    'overflow': 'scroll'
                });
            } else {
                this.$menu.css({
                    'maxHeight': '',
                    'overflow': ''
                });
            }
        },
    
        menuHide: function() {
            // When closing the menu, check to see if a callback function for onClose has been set and call it
            if ( this.$container.hasClass(this.settings['activeClass']) ) {

                // Check to see if the items' states have been changed
                this.updateItemsState(false);

                // Check diff on initial state and current state
                var hasStateChanged = (this.itemsLoadState.toString() !== this.itemsCloseState.toString());

                // If the state has changed, call the 'onClose' callback
                if (hasStateChanged) {
                    if (typeof this.settings['onClose'] != "undefined") {
                        this.settings['onClose']();
                    }
                }
            }
            this.$container.removeClass(this.settings['activeClass']);
            this.$container.removeClass(this.settings['positionedMenuClass']);
            this.$menu.css('width', 'auto');
        },
    
        menuToggle: function() {
            if ( this.$container.hasClass(this.settings['activeClass']) ) {
                this.menuHide();
            } else {
                this.menuShow();
            }
        }
    });

    $.fn[pluginName] = function(options) {
        var _this = this;
        this.each(function() {
            if ( !$.data(this, "plugin_" + pluginName) ) {
                $.data(this, "plugin_" + pluginName, new MultiSelect(this, options) );
            }
        });

        return {
            reload: function() {
                // Find the existing multiselect and remove it 
                $("[data-instance = " + dataAttrName + "]").remove();

                // Update the instance name before creating a new instance.
                dataAttrName = "multiselect_" + Math.floor(Math.random() * 10001);

                // Create a new instance of the plugin
                $.data(_this, "plugin_" + pluginName, new MultiSelect(_this, options) );
            }
        }
    };    
})(jQuery);