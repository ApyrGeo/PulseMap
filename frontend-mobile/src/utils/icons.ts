import { Platform } from 'react-native';



const w = (name: string) => ({ uri: `/icons/${name}.png` });

export const Icons = Platform.OS === 'web'
  ? {
      map:          w('map'),
      star:         w('star'),
      location:     w('location'),
      chart:        w('chart'),
      pin:          w('pin'),
      pin_owned:    w('pin_owned'),
      warning:      w('warning'),
      medal_gold:   w('medal_gold'),
      medal_silver: w('medal_silver'),
      medal_bronze: w('medal_bronze'),
      edit:         w('edit'),
      trash:        w('trash'),
      center:       w('center'),
      tap:          w('tap'),
      info:         w('info'),
      check:        w('check'),
      target:       w('target'),
      heart_empty:  w('heart_empty'),
      heart_filled: w('heart_filled'),
    }
  : {
      map:          require('../../public/icons/map.png'),
      star:         require('../../public/icons/star.png'),
      location:     require('../../public/icons/location.png'),
      chart:        require('../../public/icons/chart.png'),
      pin:          require('../../public/icons/pin.png'),
      pin_owned:    require('../../public/icons/pin_owned.png'),
      warning:      require('../../public/icons/warning.png'),
      medal_gold:   require('../../public/icons/medal_gold.png'),
      medal_silver: require('../../public/icons/medal_silver.png'),
      medal_bronze: require('../../public/icons/medal_bronze.png'),
      edit:         require('../../public/icons/edit.png'),
      trash:        require('../../public/icons/trash.png'),
      center:       require('../../public/icons/center.png'),
      tap:          require('../../public/icons/tap.png'),
      info:         require('../../public/icons/info.png'),
      check:        require('../../public/icons/check.png'),
      target:       require('../../public/icons/target.png'),
      heart_empty:  require('../../public/icons/heart_empty.png'),
      heart_filled: require('../../public/icons/heart_filled.png'),
    };
