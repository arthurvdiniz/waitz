import React, { useState, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Collapse,
  Avatar,
  IconButton,
  Typography,
  Badge,
  Fab
} from '@material-ui/core';
import { FaRegHospital } from 'react-icons/fa';
import { MdClose, MdChatBubble } from 'react-icons/md';
import { toast } from 'react-toastify';

import Services from '../../services';

import { SocketContext } from '../../context/socket';
import { Actions as AuthActions } from '../../store/ducks/auth';
import { Actions as PlaceActions } from '../../store/ducks/place';

import { queueTypes } from '../../config/place';

import CommentForm from './CommentForm';
import CommentList from './CommentList';
import Suggestion from './Suggestion';

import Styles from './style';

import isInsideRadius from '../../utils/isInsideRadius';

const PlaceDetails = () => {
  const classes = Styles.useStyles();
  const storeDispatch = useDispatch();

  const user = useSelector(state => state.user);
  const nearbyPlaces = useSelector(state => state.place.nearby);
  const placeSelected = useSelector(state =>
    state.place.nearby.find(place => place._id === state.place.selected)
  );
  const socketContext = useContext(SocketContext);

  const [expanded, setExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState({});

  const newCheckIn = type => {
    if (user.info && storeDispatch(AuthActions.checkToken())) {
      if (
        isInsideRadius(
          [user.location.lng, user.location.lat],
          [
            placeSelected.geometry.location.lng,
            placeSelected.geometry.location.lat
          ]
        )
      ) {
        socketContext.newCheckIn({
          user: user.info.username,
          place: placeSelected._id,
          type
        });
      } else {
        toast.warning('Please be near place to check in!');
      }
    } else {
      toast.warning('Please sign in to check in!');
    }
  };

  useEffect(() => {
    const getComments = async () => {
      const res = await Services.CommentService.getCommentsById(
        placeSelected._id
      );
      storeDispatch(PlaceActions.setComments(placeSelected._id, res.data));
    };
    if (placeSelected && !placeSelected.hasOwnProperty('comments')) {
      setExpanded(false);
      getComments();
    }
  }, [placeSelected, storeDispatch]);

  useEffect(() => {
    if (nearbyPlaces.length) {
      const localSuggestions = {};
      Object.entries(queueTypes).forEach((key, index) => {
        const temp = [...nearbyPlaces];
        localSuggestions[key[0]] = temp.sort((a, b) =>
          a.queue[key[0]] > b.queue[key[0]] ? 1 : -1
        );
      });
      setSuggestions(localSuggestions);
    }
  }, [nearbyPlaces]);

  return (
    <>
      {placeSelected ? (
        <Styles.Container>
          <Card className={classes.card}>
            <CardHeader
              title={placeSelected.name}
              subheader={placeSelected.vicinity}
              avatar={
                <Avatar aria-label="hospital" className={classes.avatar}>
                  <FaRegHospital />
                </Avatar>
              }
              action={
                <IconButton
                  aria-label="close"
                  onClick={() => {
                    setExpanded(false);
                    storeDispatch(PlaceActions.setSelectedPlace(null));
                  }}
                >
                  <MdClose />
                </IconButton>
              }
            />
            <CardContent>
              <Typography
                variant="body1"
                component="h5"
                className={classes.checkInTitle}
              >
                Escolha sua especialidade e faça seu check-in!
              </Typography>
              <Styles.CheckInContainer>
                {Object.entries(queueTypes).map((key, index) => (
                  <Styles.CheckInSingle key={index}>
                    <Badge
                      badgeContent={placeSelected.queue[key[0]]}
                      color="primary"
                    >
                      <Fab
                        variant="extended"
                        size="small"
                        color="primary"
                        aria-label="check-in"
                        disabled={user.hasCheckinActive}
                        onClick={() => newCheckIn(key[0])}
                      >
                        {key[1]}
                      </Fab>
                    </Badge>
                    <Suggestion
                      places={suggestions[key[0]]}
                      type={key[0]}
                      label={key[1]}
                    />
                  </Styles.CheckInSingle>
                ))}
              </Styles.CheckInContainer>
              <CardActions className={classes.cardActions}>
                <IconButton
                  aria-label="comments"
                  onClick={() => setExpanded(!expanded)}
                  className={classes.commentButton}
                >
                  <Badge
                    badgeContent={
                      placeSelected.comments ? placeSelected.comments.length : 0
                    }
                    color="primary"
                  >
                    <MdChatBubble />
                  </Badge>
                </IconButton>
              </CardActions>
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <CommentForm />
                {placeSelected.comments !== undefined ? (
                  <CommentList comments={placeSelected.comments} />
                ) : null}
              </Collapse>
            </CardContent>
          </Card>
        </Styles.Container>
      ) : null}
    </>
  );
};

export default PlaceDetails;
