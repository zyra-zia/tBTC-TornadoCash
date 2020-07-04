import { createMuiTheme } from '@material-ui/core/styles';
import grey from '@material-ui/core/colors/grey';
import pink from '@material-ui/core/colors/pink';

const CustomTheme = createMuiTheme({
  palette: {
    primary: {
      main: grey[900],
    },
    secondary: {
      main: pink[600],
    },
  }
});

export default CustomTheme;