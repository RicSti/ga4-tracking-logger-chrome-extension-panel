const keyMap = {
    '.*custom_map_dimension(.*)$': 'cd$1',
    '.*1_anonymize_ip$': 'aip',
    '.*affiliation$': 'cd5',
    '.*isAnonymous$': 'cd6',
    '.*send_page_view$': 'send_page_view',
    '.*user_properties_(.*)$': 'up.$1',
    '.*content_group(.*)': 'cg$1',
    '.*send_to': 'send_to',

    '([^_]*)_percent_scrolled$': 'percent_scrolled',
    '([^_]*)_event_category$': 'ec',
    '([^_]*)_event_label$': 'el',
  
    '([^_]*)_item_list_name$': 'il$1nm',
    '([^_]*)_items_([^_]*)_(item_|)id$': 'il$1pi$2id',
    '([^_]*)_items_([^_]*)_(item_|)name$': 'il$1pi$2nm',
    '([^_]*)_items_([^_]*)_(item_|)brand$': 'il$1pi$2br',
    '([^_]*)_items_([^_]*)_(item_|)variant$': 'il$1pi$2va',
    '([^_]*)_items_([^_]*)_(item_|)category$': 'il$1pi$2ca',
    '([^_]*)_items_([^_]*)_quantity$': 'il$1pi$2qt',
    '([^_]*)_items_([^_]*)_price$': 'il$1pi$2pr',
    '([^_]*)_items_([^_]*)_(index|list_position)$': 'il$1pi$2ps',
    '([^_]*)_items_([^_]*)_list_name$': 'il$1pi$2ln',

    // Add more key mappings here
    // For example: 'item_id$': 'piid' (matches keys ending with 'item_id')
}