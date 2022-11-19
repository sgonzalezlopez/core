#include QMK_KEYBOARD_H
#include "print.h"
#include "raw_hid.h"

enum my_layers{
  _MAIN,
  _LAYER1,
  _LAYER2,
  _LAYER3,
  _LAYER4,
  _LAYER5,
  _LAYER6,
  _FUNCTIONS,
  _OBS_SCENES,
  _SK8TM_DASHBOARD,
  _SK8TM_DASHBOARD2,
  _HOCKEY_FAULTS,
};

int16_t CURRENT_SCENE = -1;

void clear_leds_unused(uint16_t layer);
void set_layer_colors(uint16_t [], uint16_t);

enum my_keycodes {
  SAFE_ALT_F16 = SAFE_RANGE,
  SAFE_ALT_F15,
  SAFE_ALT_F19,
  SAFE_ALT_F22,
  SAFE_CTL_F15,
  SAFE_CTL_F16,
  SAFE_CTL_F19,
  SAFE_CTL_F22,
  SAFE_SFT_F16,
  SAFE_SFT_F19,
  SAFE_SFT_F22,
  CC1,
  CC2,
  CC3,
  CC4,
};

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {

  [_MAIN] = LAYOUT( CC4,       CC4,   LT(_FUNCTIONS, CC4),
                CC4,       CC4,       CC4,
                CC4,       CC4,       CC4),

  [_LAYER1] = LAYOUT( LALT(KC_F20),       LALT(KC_F21),   LT(_FUNCTIONS, SAFE_ALT_F22),
                CC4,       LALT(KC_F18),       LT(_OBS_SCENES, CC4),
                LALT(KC_F14),       LT(_SK8TM_DASHBOARD2, SAFE_ALT_F15),       LT(_SK8TM_DASHBOARD, SAFE_ALT_F16)),

  [_LAYER2] = LAYOUT(
                LCTL(KC_F20),       LCTL(KC_F21),      LT(_FUNCTIONS, SAFE_CTL_F22),
                LCTL(KC_F17),       LCTL(KC_F18),      LT(_OBS_SCENES, SAFE_CTL_F19),
                LCTL(KC_F14),       LCTL(KC_F15),      LCTL(KC_F16)),

  [_LAYER3] = LAYOUT(
                LCTL(KC_F20),       LCTL(KC_F21),      LT(_FUNCTIONS, SAFE_CTL_F22),
                LCTL(KC_F17),       LCTL(KC_F18),      LT(_OBS_SCENES, SAFE_CTL_F19),
                LCTL(KC_F14),       LCTL(KC_F15),      LT(_HOCKEY_FAULTS, SAFE_CTL_F16)),

  [_LAYER4] = LAYOUT(
                LSFT(KC_F20),       LSFT(KC_F21),       LT(_FUNCTIONS,KC_NO),
                LSFT(KC_F17),       LSFT(KC_F18),       LSFT(KC_F19),
                LSFT(KC_F14),       LSFT(KC_F15),       LSFT(KC_F16)),

  [_LAYER5] = LAYOUT(
                LCTL(KC_P7),        LCTL(KC_P8),        LT(_FUNCTIONS,KC_F13),
                LCTL(KC_P4),        LCTL(KC_P5),        LCTL(KC_P6),
                LCTL(KC_P1),        LCTL(KC_P2),        LCTL(KC_P3)),

  [_LAYER6] = LAYOUT(
                KC_F7, KC_F8, LT(_FUNCTIONS,KC_F9),
                KC_F4, KC_F5, KC_F6,
                KC_F1, KC_F2, KC_F3),

  [_FUNCTIONS] = LAYOUT(
                DF(_LAYER1),        DF(_LAYER2),        KC_TRNS,
                DF(_LAYER3),        DF(_LAYER4),        RESET,
                DF(_LAYER5),        DF(_LAYER6),        DF(_MAIN)),

  [_OBS_SCENES] = LAYOUT(
                CC1, CC1, CC1,
                CC1, CC1, KC_NO,
                CC1, CC1, CC1),

  [_SK8TM_DASHBOARD] = LAYOUT(
                CC2, CC2, CC2,
                CC2, CC2, CC2,
                CC2, CC2, KC_NO),

  [_SK8TM_DASHBOARD2] = LAYOUT(
                CC3, CC3, CC3,
                CC3, CC3, CC3,
                CC3, KC_NO, CC3),

  [_HOCKEY_FAULTS] = LAYOUT(
                LSFT(KC_F20),       LSFT(KC_F21),       LSFT(KC_F22),
                LSFT(KC_F17),       LSFT(KC_F18),       LSFT(KC_F19),
                LSFT(KC_F14),       LSFT(KC_F15),       KC_TRNS),

};

uint16_t MAIN_COLORS[] = {
      RGB_PINK,
};

uint16_t LAYER1_COLORS[] = {
      RGB_RED,     RGB_BLUE,     RGB_ORANGE,
      RGB_GREEN,    0x18, 0x63, 0xA5,     RGB_GREEN,
      RGB_PURPLE,     RGB_YELLOW,     RGB_PURPLE,
};

uint16_t LAYER2_COLORS[] = {
      RGB_ORANGE,
};

uint16_t LAYER3_COLORS[] = {
      RGB_RED,     RGB_BLUE,     RGB_GREEN,
      RGB_MAGENTA, RGB_TEAL,     0xA5, 0xF5, 0x97,
      RGB_PURPLE,  RGB_CYAN,    RGB_BLACK,
};

uint16_t LAYER4_COLORS[] = {
      RGB_TEAL,
};

uint16_t LAYER5_COLORS[] = {
      RGB_PINK,
};

uint16_t LAYER6_COLORS[] = {
      RGB_SPRINGGREEN,
};

uint16_t OBS_SCENE_COLORS[] = {
      RGB_BLACK,
};

uint16_t SK8TM_SCENE_COLORS[] = {
      RGB_BLACK,
};

uint16_t DEFAULT_COLORS[] = {
      RGB_WHITE,
};

uint16_t SK8TM_STATUS[12] = {
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
};

uint16_t SK8TM_DASHBOARD2_COLORS[] = {
  RGB_BLACK, RGB_BLUE, RGB_PURPLE,
  RGB_BLACK, RGB_BLUE, RGB_PURPLE,
  RGB_BLACK, RGB_BLACK, RGB_BLACK,
};

uint16_t HOCKEY_FAULTS_COLORS[] = {
  RGB_PINK, RGB_RED, RGB_PINK,
  0x74, 0x23, 0xBC, 0x0B, 0xC0, 0xC8, RGB_YELLOW,
  0x74, 0x23, 0xBC, 0x0B, 0xC0, 0xC8, RGB_BLACK,
};

layer_state_t layer_state_set_user(layer_state_t state) {
      switch (get_highest_layer(state)) {
    case _MAIN:
        switch (get_highest_layer(default_layer_state)) {
          case _MAIN:
              set_layer_colors(MAIN_COLORS, sizeof(MAIN_COLORS)/sizeof(MAIN_COLORS[0]));
              //rgblight_reload_from_eeprom();
              break;
          case _LAYER1:
              set_layer_colors(LAYER1_COLORS, sizeof(LAYER1_COLORS)/sizeof(LAYER1_COLORS[0]));
              break;
          case _LAYER2:
              set_layer_colors(LAYER2_COLORS, sizeof(LAYER2_COLORS)/sizeof(LAYER2_COLORS[0]));
              break;
          case _LAYER3:
              set_layer_colors(LAYER3_COLORS, sizeof(LAYER3_COLORS)/sizeof(LAYER3_COLORS[0]));
              break;
          case _LAYER4:
              set_layer_colors(LAYER4_COLORS, sizeof(LAYER4_COLORS)/sizeof(LAYER4_COLORS[0]));
              break;
          case _LAYER5:
              set_layer_colors(LAYER5_COLORS, sizeof(LAYER5_COLORS)/sizeof(LAYER5_COLORS[0]));
              break;
          case _LAYER6:
              set_layer_colors(LAYER6_COLORS, sizeof(LAYER6_COLORS)/sizeof(LAYER6_COLORS[0]));
              break;
          default:
              set_layer_colors(DEFAULT_COLORS, sizeof(DEFAULT_COLORS)/sizeof(DEFAULT_COLORS[0]));
              break;
        }
        //set_layer_colors(get_highest_layer(default_layer_state));
        clear_leds_unused(get_highest_layer(default_layer_state));
        break;
    case _OBS_SCENES:
        rgblight_setrgb (RGB_BLACK);
        if (CURRENT_SCENE >= 0 && CURRENT_SCENE <9) {
            int r = CURRENT_SCENE / 2;
            int c = CURRENT_SCENE % 2;
            rgblight_setrgb_at(RGB_YELLOW, r*3 + c);
        }
        break;
    case _SK8TM_DASHBOARD:
        rgblight_setrgb (RGB_BLACK);
        for (int i = 0; i < 8; i++) {
          if (SK8TM_STATUS[i] == 1) rgblight_setrgb_at(RGB_ORANGE, i);
        }
        break;
    case _HOCKEY_FAULTS:
        set_layer_colors(HOCKEY_FAULTS_COLORS, sizeof(HOCKEY_FAULTS_COLORS)/sizeof(HOCKEY_FAULTS_COLORS[0]));
        break;
    case _SK8TM_DASHBOARD2:
        set_layer_colors(SK8TM_DASHBOARD2_COLORS, sizeof(SK8TM_DASHBOARD2_COLORS)/sizeof(SK8TM_DASHBOARD2_COLORS[0]));
        if (SK8TM_STATUS[8] == 1) rgblight_setrgb_at(RGB_ORANGE, 0);
        if (SK8TM_STATUS[9] == 1) rgblight_setrgb_at(RGB_ORANGE, 3);
        if (SK8TM_STATUS[10] == 1) rgblight_setrgb_at(RGB_ORANGE, 6);
        if (SK8TM_STATUS[11] == 1) rgblight_setrgb_at(RGB_ORANGE, 8);
        break;
    case _FUNCTIONS:
        rgblight_setrgb (0x00,  0xFF, 0x00);
        rgblight_setrgb_at (0x00, 0x00, 0x00, 2);
        rgblight_setrgb_at(0xFF, 0x00, 0x00, 5);
        rgblight_setrgb_at(0x00, 0x00, 0xFF, 8);
        //clear_leds_unused(get_highest_layer(_FUNCTIONS));
        break;
    default: //  for any other layers, or the default layer
        rgblight_setrgb (0x00,  0xFF, 0xFF);
        break;
    }
  return state;
}

void set_layer_colors (uint16_t color_set[], uint16_t size) {

 if (size<9) {
   rgblight_setrgb (color_set[0],  color_set[1], color_set[2]);
 }
 else {
    for (int i = 0; i < 9; i++) {
      rgblight_setrgb_at (color_set[i*3], color_set[i*3+1],  color_set[i*3+2], i);
    }
 }


  return;
}

void clear_leds_unused(uint16_t layer) {
  for (uint8_t row = 0; row < MATRIX_ROWS; row++) {
    for (uint8_t col = 0; col < MATRIX_COLS; col++) {

        // read each key in the row data and check if the keymap defines it as a real key
        if (pgm_read_byte(&keymaps[layer][row][col]) == KC_NO || pgm_read_byte(&keymaps[layer][row][col]) == KC_TRNS) {
          rgblight_setrgb_at (0x00, 0x00, 0x00, row * 3 + col);
          // this creates new row data, if a key is defined in the keymap, it will be set here
        }
   }
  }
  return;
}

uint16_t time_init;

bool process_record_user(uint16_t keycode, keyrecord_t *record) {
  if (layer_state_is(_OBS_SCENES) ) {
    if (record->event.pressed) {
      time_init = record->event.time;
    } else {
      if (record->event.time - time_init < 275) {
        rgblight_setrgb(RGB_BLACK);
        rgblight_setrgb_at(RGB_YELLOW, record->event.key.row * 3 + record->event.key.col);
      }
    }
  }
  uprintf("%u - %u - %u\n", CC1, keycode, record->tap.count);
  switch (keycode) {
    case CC1:
        if (record->event.pressed) {
            uint8_t msg[32] = {0};
            msg[0] = 3;
            msg[1] = record->event.key.row;
            msg[2] = record->event.key.col;
          raw_hid_send(msg, sizeof(msg));
        }
        return false;
    case CC2:
        if (record->event.pressed) {
            uint8_t msg[32] = {0};
            msg[0] = 4;
            msg[1] = record->event.key.row;
            msg[2] = record->event.key.col;
            raw_hid_send(msg, sizeof(msg));
            uint16_t led = record->event.key.row*3+record->event.key.col;
            if (SK8TM_STATUS[led] == 0) {
              rgblight_setrgb_at(RGB_ORANGE, led);
              SK8TM_STATUS[led] = 1;
            }
            else {
              rgblight_setrgb_at(RGB_BLACK, led);
              SK8TM_STATUS[led] = 0;
            }
        }
        return false;
    case CC3:
        if (record->event.pressed) {
            uint8_t msg[32] = {0};
            msg[0] = 5;
            msg[1] = record->event.key.row;
            msg[2] = record->event.key.col;
            raw_hid_send(msg, sizeof(msg));
            uint16_t led = record->event.key.row*3+record->event.key.col;
            uint8_t index = led == 0 ? 8 : led == 3 ? 9 : led == 6 ? 10 : 11;
            if (record->event.key.col==0 || led == 8) {
                if (SK8TM_STATUS[index] == 0) {
                rgblight_setrgb_at(RGB_ORANGE, led);

                SK8TM_STATUS[index] = 1;
                }
                else {
                rgblight_setrgb_at(RGB_BLACK, led);
                SK8TM_STATUS[index] = 0;
                }
            }
        }
        return false;
    case CC4:
    case LT(_OBS_SCENES, CC4):
            // tap
        uprintf("%u\n", record->tap.count);
        if (keycode == CC4 || record->tap.count > 0) {
            if (record->event.pressed) {
                uint8_t msg[32] = {0};
                msg[0] = 6;
                msg[1] = record->event.key.row;
                msg[2] = record->event.key.col;
                raw_hid_send(msg, sizeof(msg));
            }
            return false; // disable the default action
        }
        return true;
    case LT(_HOCKEY_FAULTS, SAFE_CTL_F16):
        if (record->tap.count > 0) {
            // tap
            if (record->event.pressed) {
                register_code16(C(KC_F16));
            } else {
                unregister_code16(C(KC_F16));
            }
            return false; // disable the default action
        } else {
            // hold - use the default action
            return true;
        }
    case LT(_SK8TM_DASHBOARD2, SAFE_ALT_F15):
        if (record->tap.count > 0) {
            // tap
            if (record->event.pressed) {
                register_code16(A(KC_F15));
            } else {
                unregister_code16(A(KC_F15));
            }
            return false; // disable the default action
        } else {
            // hold - use the default action
            return true;
        }
    case LT(_FUNCTIONS, SAFE_ALT_F16):
    case LT(_OBS_SCENES, SAFE_ALT_F16):
    case LT(_SK8TM_DASHBOARD, SAFE_ALT_F16):
        if (record->tap.count > 0) {
            // tap
            if (record->event.pressed) {
                register_code16(A(KC_F16));
            } else {
                unregister_code16(A(KC_F16));
            }
            return false; // disable the default action
        } else {
            // hold - use the default action
            return true;
        }
    case LT(_FUNCTIONS, SAFE_ALT_F22):
    case LT(_OBS_SCENES, SAFE_ALT_F22):
    case LT(_SK8TM_DASHBOARD, SAFE_ALT_F22):
        if (record->tap.count > 0) {
            // tap
            if (record->event.pressed) {
                register_code16(A(KC_F22));
            } else {
                unregister_code16(A(KC_F22));
            }
            return false; // disable the default action
        } else {
            // hold - use the default action
            return true;
        }
    case LT(_FUNCTIONS, SAFE_CTL_F22):
    case LT(_OBS_SCENES, SAFE_CTL_F22):
    case LT(_SK8TM_DASHBOARD, SAFE_CTL_F22):
        if (record->tap.count > 0) {
            // tap
            if (record->event.pressed) {
                register_code16(C(KC_F22));
            } else {
                unregister_code16(C(KC_F22));
            }
            return false; // disable the default action
        } else {
            // hold - use the default action
            return true;
        }
    case LT(_FUNCTIONS, SAFE_SFT_F22):
    case LT(_OBS_SCENES, SAFE_SFT_F22):
    case LT(_SK8TM_DASHBOARD, SAFE_SFT_F22):
        if (record->tap.count > 0) {
            // tap
            if (record->event.pressed) {
                register_code16(S(KC_F22));
            } else {
                unregister_code16(S(KC_F22));
            }
            return false; // disable the default action
        } else {
            // hold - use the default action
            return true;
        }
    // Tecla para Layer 8
    case LT(_FUNCTIONS, SAFE_ALT_F19):
    case LT(_OBS_SCENES, SAFE_ALT_F19):
    case LT(_SK8TM_DASHBOARD, SAFE_ALT_F19):
        if (record->tap.count > 0) {
            // tap
            if (record->event.pressed) {
                register_code16(A(KC_F19));
            } else {
                unregister_code16(A(KC_F19));
            }
            return false; // disable the default action
        } else {
            // hold - use the default action
            return true;
        }
    case LT(_FUNCTIONS, SAFE_CTL_F19):
    case LT(_OBS_SCENES, SAFE_CTL_F19):
    case LT(_SK8TM_DASHBOARD, SAFE_CTL_F19):
        if (record->tap.count > 0) {
            // tap
            if (record->event.pressed) {
                register_code16(C(KC_F19));
            } else {
                unregister_code16(C(KC_F19));
            }
            return false; // disable the default action
        } else {
            // hold - use the default action
            return true;
        }
    case LT(_FUNCTIONS, SAFE_SFT_F19):
    case LT(_OBS_SCENES, SAFE_SFT_F19):
    case LT(_SK8TM_DASHBOARD, SAFE_SFT_F19):
        if (record->tap.count > 0) {
            // tap
            if (record->event.pressed) {
                register_code16(S(KC_F19));
            } else {
                unregister_code16(S(KC_F19));
            }
            return false; // disable the default action
        } else {
            // hold - use the default action
            return true;
        }
    case RESET:
       rgblight_setrgb (0x00,  0x00, 0x00);
       rgblight_setrgb_at(0xFF, 0x00, 0x00, 1);
       rgblight_setrgb_at(0xFF, 0x00, 0x00, 3);
       rgblight_setrgb_at(0xFF, 0x00, 0x00, 5);
       rgblight_setrgb_at(0xFF, 0x00, 0x00, 7);
       break;
    default:
      return true; // Process all other keycodes normally
  }

  return true;
}

void raw_hid_receive(uint8_t *data, uint8_t length) {
  // PC connected, so set the flag to show a message on the master display

  // Initial connections use '1' in the first byte to indicate this
  if (length > 1 && data[0] == 1) {
    uprintf("Data %u  - %u - %u \n", data[0], data[1], data[2]);
    if (data[1]==1) {
      uint8_t send_data[32] = {0};
      send_data[0] = 1; // Add one so that we can distinguish it from a null byte
      send_data[1] = MATRIX_ROWS; // Add one so that we can distinguish it from a null byte
      send_data[2] = MATRIX_COLS;
      raw_hid_send(send_data, sizeof(send_data));
      // New connection so restart screen_data_buffer

      // Tell the connection which info screen we want to look at initially
      //raw_hid_send_screen_index();
      return;
    }
    else if (data[1] == 5) {
    uprintf("Data %u\n", data[2]);
      CURRENT_SCENE = data[2];
    }
    else if (data[1] == 6) {
        int l = sizeof(SK8TM_STATUS)/sizeof(SK8TM_STATUS[0]);
      for (int i = 0; i<l; i++) {
        SK8TM_STATUS[i] = data[i+2];
      }
    }
  }
}

void keyboard_post_init_user(void) {
  // Call the post init code.

//  rgblight_enable_noeeprom(); // enables Rgb, without saving settings
//  rgblight_sethsv_noeeprom(180, 255, 255); // sets the color to teal/cyan without saving
//  rgblight_mode_noeeprom(RGBLIGHT_MODE_BREATHING + 3); // sets mode to Fast breathing without saving
}

