import React, { useState } from 'react'
import Delete from '@mui/icons-material/Delete'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import { useNavigate } from 'react-router-dom'
import './UserCard.css'

interface UserCardProps {
  indb: IDBDatabase;
  name: string;
  phone: string;
  date: string;
}

function UserCard(props: UserCardProps) {
  const phoneStr = `${props.phone.substring(0, 3)} **** **${props.phone.substring(9)}`
  const navigate = useNavigate()
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null)

  const removeUser = () => {
    let request = props.indb.transaction('user', 'readwrite').objectStore('user').delete(props.phone)
    request.onsuccess = (event) => {
      console.log('用户已被移除')
      handleClose()
      window.location.reload()
    }
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX - 2,
          mouseY: event.clientY - 4,
        }
        : null,
    )
  }

  const handleClose = () => {
    setContextMenu(null)
  }


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
      onContextMenu={handleContextMenu}
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
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={removeUser}>
          <ListItemIcon>
            <Delete />
          </ListItemIcon>
          <ListItemText>移除</ListItemText>
        </MenuItem>
      </Menu>
    </Card >
  )
}

export default UserCard