import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import DayGridPlugin from '@fullcalendar/daygrid';
import InteractionPlugin from '@fullcalendar/interaction';
import ListPlugin from '@fullcalendar/list';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/list/main.css';
import { makeStyles } from '@material-ui/core/styles';
import moment from 'moment';
import CircularProgress from '@material-ui/core/CircularProgress';
import { getOccultations } from '../api/Occultation';
import AppBar from './AppBarCalendario';

const useStyles = makeStyles(() => ({
  loading: {
    position: 'fixed',
    top: '50%',
    left: 'calc(50% + 120px)',
    zIndex: 100,
    transform: 'translate(-50%, -50%)',
    animation: 'none',
  },
  label: {
    float: 'right',
  },
  labelBlue: {
    color: '#3788D8',
  },
  labelGreen: {
    color: '#008000',
  },
}));

function OccultationCalendar({ history, setTitle, match: { params } }) {
  const [events, setEvents] = useState([]);
  const [initialDate, setInitialDate] = useState(params.sDate ? params.sDate : moment(new Date()).startOf('month').format('YYYY-MM-DD'));
  const [finalDate, setFinalDate] = useState(moment(new Date()).endOf('month').format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(params.searching ? params.searching : '');
  const [hasSearch, setHasSearch] = useState(false);

  const classes = useStyles();

  const loadData = () => {

    setLoading(true);

    const filters = [
      {
        property: 'date_time__range',
        value: [initialDate, finalDate].join(),
      },
      {
        property: 'most_recent_only',
        value: true,
      },
    ];

    if (search && search !== '') {
      filters.push({
        property: 'asteroid__name__icontains',
        value: search,
      });
    }

    getOccultations({ filters, pageSize: 3000 }).then((res) => {
      const data = res.results;
      const result = [];

      data.map((resp) => {
        // Se o asteroid tiver numero, o nome do asteroid passa a ser NAME(Number) se nao so NAME.
        const asteroid_name = parseInt(resp.asteroid_number) > 0 ? `${resp.asteroid_name} (${resp.asteroid_number})` : resp.asteroid_name;

        result.push({
          id: resp.id,
          title: asteroid_name,
          date: resp.date_time,
          textColor: 'white',
        });
      });

      setEvents(result);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    setTitle('Occultation Calendar');

    loadData();
  }, [initialDate, finalDate]);

  useEffect(() => {
    loadData();
  }, [search]);

  const header = {
    center: 'title',
    right: 'prev,next, ',
    month: 'month',
    listYear: 'Year',
    left: 'dayGridDay,dayGridWeek,dayGridMonth,listYear',
  };

  const handleDateRender = (arg) => {
    const start_date = moment(arg.view.currentStart).format('YYYY-MM-DD');
    const end_date = moment(arg.view.currentEnd).subtract(1, 'days').format('YYYY-MM-DD');

    // Um problema que surgiu nesta p??gina foi o seguinte:
    // Quando o calend??rio renderiza, ele traz consigo uma data default que ?? especificada
    // no atributo no componente. Se o calend??rio n??o fosse pra p??gina de oculta????es estaria tudo certo.
    // Por??m como ele vai pra outra p??gina e retorna trazendo as informa????es de datas iniciais e finais
    // ent??o foi necess??rio montar um esquema pra que ele n??o se perdesse nas renderiza????es.
    // Desto modo toda vez que ele renderiza, ou ele pega o valor dos params que retornam da p??gina de
    // oculta????es ou ele renderiza um valor default do dia e m??s corrente.
    // J?? a parte do c??digo abaixo obriga o calend??rio re-renderizar, quebrando portanto a regra de valor
    // default. Isso foi extemamente ??til pra administrar o conte??do de forma orgamizada.
    // Ou seja, os valores default s??o sempre carregados na inicializa????o.
    // Os valores abaixo definidos s??o sempre carregados a partir da navega????o do usu??rio.
    // Desta forma consegui amarrar o conte??do.

    setInitialDate(start_date);
    setFinalDate(end_date);
  };

  // Variable used to change specific button name
  const buttonText = {
    listYear: 'year',
    month: 'month',
  };

  const handleEvent = (e) => {
    history.push({
      pathname: `/occultations/${e.event.id}`,
      state: {
        date: e.event.start,
        view: e.view.type,
        flag: 'calendar',
        initialDate,
        finalDate,
        search,
      },
    });
  };

  const handleEventRender = (event) => {
    const time = moment(event.event.start).format('H');

    if (time >= 18) {
      event.el.innerHTML = `${event.el.innerHTML}<Icon id='sol_lua' class='fas fa-moon'></i>`;
    } else {
      event.el.innerHTML = `${event.el.innerHTML}<Icon id='sol_lua' class='fas fa-sun'></i>`;
    }
  };

  return (
    <div>
      {loading && <CircularProgress size={120} thickness={0.8} className={classes.loading} />}
      <AppBar setSearch={setSearch} setHasSearch={setHasSearch} value={search} />

      {/* params.date is coming back from occulation.
      It's being used to maintain data that went from calendar to occultation.
      Flow:
      1 -User chooses an event.
      2- The specific data goes to occultation.
      3 - On occultation screen user click on back button.
      4 - When back, data comes inside params props.(params are internal(internal operation)); */}
      <FullCalendar
        header={header}
        events={events}
        defaultDate={params.sDate ? params.sDate : initialDate}
        eventClick={handleEvent}
        buttonText={buttonText}
        plugins={[DayGridPlugin, InteractionPlugin, ListPlugin]}
        defaultView={params.view ? params.view : null}
        themeSystem="standard"
        datesRender={handleDateRender}
        weekNumbers
        eventRender={handleEventRender}
      />
    </div>
  );
}

export default withRouter(OccultationCalendar);
