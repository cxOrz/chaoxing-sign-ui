import { Typography, Card, CardContent, CardActionArea } from '@mui/material'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import './UserCard.css'

function UserCard(props) {
  const phoneStr = `${props.phone.substr(0, 3)} **** **${props.phone.substr(9, 2)}`
  const navigate = useNavigate()
  return (
    <Card sx={{
      display: 'inline-block',
      maxWidth: 345,
      minWidth: 300,
      backgroundColor: '#ecf0f3',
      marginBottom: 3.5,
      marginRight: 3.5,
      verticalAlign: 'bottom'
    }}
      className='neum-card'
    >
      <CardActionArea onClick={() => { navigate('/dash/' + props.phone) }}>
        <CardContent>
          <Typography variant="h5" align='left' component="div">
            <span className='name'>{props.name}</span>
            <p>{phoneStr}</p>
          </Typography>
          <Typography sx={{ color: 'rgb(73, 85, 105)' }} variant="body2" align='right'>
            凭证日期：{props.date}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card >
  )
}

export default UserCard