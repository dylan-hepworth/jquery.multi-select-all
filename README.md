# jquery-multi-select-all

This is forked from `mySociety's` `jquery.multi-select.js` plugin ([https://github.com/mysociety/jquery-multi-select](https://github.com/mysociety/jquery-multi-select)). This fork enhances this plugin by adding the "allOptionValue" and "onClose" options.

Converts `<select multiple>` elements into dropdown menus with a checkbox for each `<option>`.

## Use this plugin

Assuming HTML markup like this:

    <label for="people">Select people:</label>
    <select id="people" name="people" multiple>
        <option value="alice">Alice</option>
        <option value="bob">Bob</option>
        <option value="carol">Carol</option>
    </select>

You’ll want to run this:

    $('#people').multiSelect();

You can pass a number of options into `.multiSelect()` to customise the HTML output it generates. Eg:

    $('#people').multiSelect({
        allOptionValue: "All",
        containerHTML: '<div class="btn-group">',
        menuHTML: '<div class="dropdown-menu">',
        buttonHTML: '<button class="btn btn-default">',
        menuItemHTML: '<label>',
        activeClass: 'dropdown-menu--open',
        noneText: '-- Select --',
        allText: 'All Selected',
        presets: [
            { name: 'Favouris', options: ['item2', 'item4'] }
        ]
    });

Options related to markup:

| Option | Default value | Notes |
|---|---|---|
| `containerHTML` | `'<div class="multi-select-container">'` |  |
| `menuHTML` | `'<div class="multi-select-menu">'` |  |
| `buttonHTML` | `'<span class="multi-select-button">'` |  |
| `menuItemsHTML` | `'<div class="multi-select-menuitems">'` |  |
| `menuItemHTML` | `'<label class="multi-select-menuitem">'` |  |
| `presetsHTML` | `'<div class="multi-select-presets">'` |  |
| `modalHTML` | `undefined` | Set this to some HTML (eg: `<div class="multi-select-modal">`) to enable the modal overlay. |
| `activeClass` | `'multi-select-container--open'` | The class that will be added to the container element when the menu is "open". |

Options related to labels and (select) options:

| Option | Default value | Notes |
|---|---|---|
| `noneText` | `'-- Select --'` | Shown in the button when no options have been selected. |
| `allText` | `undefined` | Shown in the button when all options have been selected. |
| `presets` | `undefined` | An array of preset option groups, see the demo for an example. |
| `allOptionValue` | `undefined` | Set this to the string value of your "All" option. |
| `onClose` | `undefined` | Assign a callback function when the dropdown selector is closed. |

Options related to positioning:

| Option | Default value | Notes |
|---|---|---|
| `positionMenuWithin` | `undefined` | If you provide a jQuery object here, the plugin will add a class (see `positionedMenuClass` option) to the container when the _right edge_ of the dropdown menu is about to extend outside the specified element, giving you the opportunity to use CSS to prevent the menu extending, for example, by allowing the option labels to wrap onto multiple lines. |
| `positionedMenuClass` | `'multi-select-container--positioned'` | The class that will be added to the container, when the menu is about to extend beyond the _right edge_ of the `positionMenuWithin` element. |
| `viewportBottomGutter` | `20` | The plugin will attempt to keep this distance, in pixels, clear between the bottom of the menu and the bottom of the viewport, by setting a fixed `height` style if the menu would otherwise approach this distance from the _bottom edge_ of the viewport. |
| `menuMinHeight` | `200` | The minimum height, in pixels, that the menu will be reduced to before the `viewportBottomGutter` option is ignored and the menu is allowed to extend beyond the _bottom edge_ of the viewport. |

## Reloading the Plugin
In some cases you may run into a scenario where you want to reload the list. For example, it's possible that you need to add new options to the select box. If you were to just add new options to the DOM, they would not show up in the multi-select. Fortunately you can instantiate a definition of the multi-select and call its reload method. For example:

    var myMultiSelect = $('#select_list').multiSelect();

    // Simulate removing all current values and adding new ones
    $("#select_list").empty()
        .append(new Option("New Option 1", "value1"))
        .append(new Option("New Option 2", "value2"))
        .append(new Option("New Option 3", "value3"))
        .append(new Option("New Option 4", "value4"));
        
    // Reload the multi-select with the updated options
    myMultiSelect.reload();

## See a demo

Open `index.html` in your web browser.
