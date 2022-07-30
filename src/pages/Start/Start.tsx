import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import AddCircleOutlineOutlined from '@mui/icons-material/AddCircleOutlineOutlined'
import Button from '@mui/material/Button'
import ButtonBase from '@mui/material/ButtonBase'
import Icon from '@mui/material/Icon'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import TextField from '@mui/material/TextField'
import DialogActions from '@mui/material/DialogActions'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import UserCard from '../../components/UserCard/UserCard'
import { login_api } from '../../config/api'
import { UserParamsType } from '../../types/global'
import './Start.css'

type UserListType = UserParamsType[]

function Start() {
  const [indb, setIndb] = useState<IDBDatabase>()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(false)
  const [user, setUser] = useState<UserListType>([])
  const loginBtn = useRef<HTMLButtonElement>(null)
  const phone = useRef<HTMLInputElement>(null)
  const password = useRef<HTMLInputElement>(null)

  const login = async () => {
    loginBtn.current!.disabled = true
    let res = await axios.post(login_api, {
      phone: phone.current!.value,
      password: password.current!.value
    })
    let phoneNum = phone.current!.value
    let userPwd = password.current!.value
    loginBtn.current!.removeAttribute('disabled')
    // 登陆成功
    if (res.data !== 'AuthFailed') {
      setOpen(false)

      // 写入数据库
      let request = indb!.transaction(['user'], 'readwrite')
        .objectStore('user')
        .put({
          phone: phoneNum, // 手机号
          fid: res.data.fid,
          vc3: res.data.vc3,
          password: userPwd, // 自动通过储存的密码重新登陆
          _uid: res.data._uid,
          _d: res.data._d,
          uf: res.data.uf,
          name: res.data.name, // 姓名
          date: new Date() // 判断时间进行重新认证身份
        })
      request.onerror = () => { console.log('用户写入失败') }
      request.onsuccess = () => {
        console.log('用户写入成功')
        window.location.reload()
      }
    }
    else {
      setMessage(true)
    }
  }

  useEffect(() => {
    // 打开或创建数据库
    const request = window.indexedDB.open('ui')
    request.onerror = () => {
      console.log('数据库打开失败')
    }
    // 打开成功
    request.onsuccess = (event) => {
      console.log("数据库打开成功")
      setIndb(request.result)
      // 遍历全部数据
      const cursor_request = request.result.transaction('user', 'readwrite').objectStore('user').openCursor()
      cursor_request.onsuccess = (event) => {
        let cursor = cursor_request.result
        if (cursor) {
          // console.log(cursor.key)
          // console.log(cursor.value)
          let userValue = cursor.value // 在safari中需要将参数值存到变量，再传给setState不然undefined
          setUser((prev) => {
            return [...prev, userValue]
          })
          cursor.continue()
        }
      }
    }
    // 是否创建数据表
    request.onupgradeneeded = (event) => {
      let db = request.result
      if (!db.objectStoreNames.contains('ui')) {
        db.createObjectStore('user', { keyPath: 'phone' })
        console.log('数据表已创建')
      }
    }
  }, [])

  return (
    <div className='start-box'>
      <h1>让我们开始吧</h1>
      <p className='hint'>你可以选择或添加一个用户</p>
      {
        // 渲染所有用户卡片
        user.map((e, i) => {
          return (<UserCard
            indb={indb as IDBDatabase}
            key={i}
            name={e.name}
            phone={e.phone}
            date={new Date(e.date).toLocaleString()}
          />)
        })
      }
      <ButtonBase
        sx={{
          maxWidth: 345,
          minWidth: 300,
          backgroundColor: '#ecf0f3',
          height: 165,
          marginBottom: 3.5,
          marginRight: 3.5
        }}
        className='neum-card'
        onClick={() => { setOpen(true) }}
      >
        <Icon sx={{
          width: 'auto',
          height: 'auto'
        }}>
          <AddCircleOutlineOutlined fontSize='large' htmlColor='#6f788c' />
        </Icon>
      </ButtonBase>

      <Dialog open={open} onClose={() => { setOpen(false) }}>
        <DialogTitle>添加用户</DialogTitle>
        <DialogContent>
          <DialogContentText>
            添加你的学习通账号，完成后可选择账号登录，进行签到。
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="phone"
            label="手机号码"
            inputRef={phone}
            type="tel"
            fullWidth
            variant="standard"
          />
          <TextField
            margin="dense"
            id="pwd"
            label="密码"
            inputRef={password}
            type="password"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpen(false) }}>取消</Button>
          <Button ref={loginBtn} onClick={login}>确认添加</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={message}
        autoHideDuration={2000}
        onClose={() => { setMessage(false) }}
      >
        <Alert onClose={() => { setMessage(false) }} severity="error" sx={{ width: '100%' }}>
          登陆失败
        </Alert>
      </Snackbar>
    </div>
  )
}

export default Start