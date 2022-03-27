import { Typography, Card, CardContent, CardMedia, CardActionArea, CardActions, IconButton } from '@mui/material'
import React from 'react'
import './UserCard.css'

function UserCard(props) {
  const phoneStr = `${props.phone.substr(0, 3)} **** **${props.phone.substr(9, 2)}`
  return (
    <Card sx={{
      display: 'inline-block',
      maxWidth: 345,
      minWidth: 300,
      backgroundColor: '#f5f7f9',
      marginBottom: 1,
      marginRight: 1,
      boxShadow: 'none',
      verticalAlign: 'bottom'
    }}>
      <CardActionArea>
        <CardContent>
          <Typography variant="h5" align='left' component="div">
            <span className='name'>{props.name}</span>
            <p>{phoneStr}</p>
          </Typography>
          <Typography variant="body2" align='right'>
            添加日期：{props.date}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

export default UserCard