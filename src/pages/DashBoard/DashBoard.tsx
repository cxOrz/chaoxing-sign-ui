import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Box } from '@mui/system'
import { Decoder } from '@nuintun/qrcode'
import { useParams } from 'react-router-dom'
import { activity_api, general_api, login_api, location_api, qrcode_api, photo_api, upload_api, uvtoken_api, ocr_api } from '../../config/api'
import { Alert, ButtonBase, CircularProgress, Snackbar } from '@mui/material'
import './DashBoard.css'
import { UserParamsType } from '../../types/global'
import { AlertColor } from '@mui/material'

interface SignInfo {
  activity: Activity
  status: string;
}
interface Activity {
  name: string;
  aid?: string | number;
  courseId?: string | number;
  classId?: string | number;
  otherId?: string | number;
}
interface AlertInfo {
  msg: string;
  show: boolean;
  severity: AlertColor;
}

function DashBoard() {
  const params = useParams()
  const [userParams, setUserParams] = useState<UserParamsType>({} as UserParamsType)
  const [sign, setSign] = useState<SignInfo>({
    activity: {
      name: ''
    },
    status: ''
  })
  const [progress, setProgress] = useState(false)
  const [btnProgress, setBtnProgress] = useState(false)
  const [scanProgress, setScanProgress] = useState(false)
  const [radio, setRadio] = useState(0)
  const [values, setValues] = useState<{ [index: string]: string | File }>({})
  const [alert, setAlert] = useState<AlertInfo>({ msg: '', show: false, severity: 'info' })

  const [control, setControl] = useState({
    start: {
      show: true
    }
  })

  const start = async () => {
    document.getElementById('start-btn')!.classList.add('hidden')
    setTimeout(() => {
      setControl({ start: { show: false } })
      setProgress(true)
    }, 500)
    let activity = await axios.post(activity_api, {
      uf: userParams.uf,
      _d: userParams._d,
      vc3: userParams.vc3,
      uid: userParams._uid
    })
    console.log(activity.data)
    setProgress(false)
    if (activity.data === 'NoActivity') {
      setSign({ activity: { name: '无签到活动' }, status: '' })
    } else {
      setSign({ activity: (activity.data as Activity), status: '' })
    }
  }

  const generalSign = async () => {
    let result = await axios.post(general_api, {
      uf: userParams.uf,
      _d: userParams._d,
      vc3: userParams.vc3,
      uid: userParams._uid,
      fid: userParams.fid,
      aid: sign.activity.aid,
      name: userParams.name
    })
    return result.data
  }
  const photoSign = async (objectId: string) => {
    let result = await axios.post(photo_api, {
      uf: userParams.uf,
      _d: userParams._d,
      vc3: userParams.vc3,
      uid: userParams._uid,
      fid: userParams.fid,
      aid: sign.activity.aid,
      name: userParams.name,
      objectId: objectId
    })
    return result.data
  }
  const qrcodeSign = async (enc: string) => {
    let result = await axios.post(qrcode_api, {
      uf: userParams.uf,
      _d: userParams._d,
      vc3: userParams.vc3,
      uid: userParams._uid,
      fid: userParams.fid,
      aid: sign.activity.aid,
      name: userParams.name,
      enc: enc
    })
    return result.data
  }
  const locationSign = async (lat: string, lon: string, address: string) => {
    let result = await axios.post(location_api, {
      uf: userParams.uf,
      _d: userParams._d,
      vc3: userParams.vc3,
      uid: userParams._uid,
      fid: userParams.fid,
      aid: sign.activity.aid,
      name: userParams.name,
      lat: lat,
      lon: lon,
      address: address
    })
    return result.data
  }

  const handleRadio = (type: 'general' | 'photo') => {
    let label_general = document.getElementById('label-general')
    let label_photo = document.getElementById('label-photo')
    switch (type) {
      case 'general': {
        label_general!.className = 'checked'
        label_photo!.className = 'unchecked'
        setRadio(0)
        break
      }
      case 'photo': {
        label_general!.className = 'unchecked'
        label_photo!.className = 'checked'
        setAlert({ msg: '确保已将照片上传指定位置，点击签到', severity: 'info', show: true })
        setRadio(1)
        break
      }
      default: break
    }
  }
  const updateValue = (name: string, value: string | File) => {
    setValues((prev) => {
      let object = { ...prev }
      object[name] = value
      return object
    })
  }
  const setStatus = (res: string) => {
    if (res === 'success') {
      setSign((prev) => {
        return {
          activity: prev.activity,
          status: '签到成功'
        }
      })
    } else {
      setSign((prev) => {
        return {
          activity: prev.activity,
          status: res
        }
      })
    }
  }
  const onSign_0 = async () => {
    let res: string
    if ((document.getElementById('general') as HTMLInputElement)!.checked) {
      res = await generalSign()
    } else {
      setBtnProgress(true)
      // 获取uvtoken
      let token = await getuvToken()
      // 上传文件，获取上传结果
      let result_upload = await uploadFile(values['photo'] as File, token)
      console.log(result_upload)
      // 传入objectId进行签到
      res = await photoSign(result_upload.objectId)
      setBtnProgress(false)
    }
    (document.getElementById('sign-btn') as HTMLButtonElement)!.disabled = true
    let neum_form = document.getElementsByClassName('neum-form')[0]
    let content = document.getElementById('neum-form-content')
    content!.style.opacity = '0'
    setTimeout(() => {
      content!.style.display = 'none'
      neum_form.classList.add('form-height')
      setStatus(res)
    }, 600)
  }
  const onSign_2 = async () => {
    let res = await qrcodeSign(values['enc'] as string);
    (document.getElementById('sign-btn') as HTMLButtonElement)!.disabled = true
    let neum_form = document.getElementsByClassName('neum-form')[0]
    let content = document.getElementById('neum-form-content')
    content!.style.opacity = '0'
    setTimeout(() => {
      content!.style.display = 'none'
      neum_form.classList.add('form-height')
      setStatus(res)
    }, 600)
  }
  // [默认] 使用浏览器解析ENC，成功率较低
  const parseEnc = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const url = window.URL || window.webkitURL
      const img = new Image()
      const qrcode = new Decoder()
      img.src = url.createObjectURL(file)
      qrcode.scan(img.src).then(result => {
        resolve(result.data.split('=').pop() as string)
      }).catch((reason) => {
        console.log(reason)
        resolve('识别失败')
      })
    })
  }
  // [推荐] 使用腾讯云OCR解析ENC，请在cli项目中配置secretId和secretKey
  // const parseEnc = async (inputFile: File) => {
  //   let data = new FormData()
  //   data.append("file", inputFile)
  //   let res = await axios.post(ocr_api, data, {
  //     headers: {
  //       'Content-type': 'multipart/form-data'
  //     }
  //   })
  //   return res.data
  // }
  const setEncByQRCodeImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files![0]
    setScanProgress(true)
    // 对图片文件进行解析获得enc
    const enc = await parseEnc(image)
    values['enc'] = enc
    const encInput = document.getElementById('input-enc')
    encInput!.setAttribute('value', enc)
    setScanProgress(false)
  }
  const onSign_4 = async () => {
    let latlon = values['latlon'] as string, address = values['address'] as string
    let res = await locationSign(latlon.substring(latlon.indexOf(',') + 1, latlon.length),
      latlon.substring(0, latlon.indexOf(',')), address);
    (document.getElementById('sign-btn') as HTMLButtonElement)!.disabled = true
    let neum_form = document.getElementsByClassName('neum-form')[0]
    let content = document.getElementById('neum-form-content')
    content!.style.opacity = '0'
    setTimeout(() => {
      content!.style.display = 'none'
      neum_form.classList.add('form-height')
      setStatus(res)
    }, 600)
  }
  const onSign_35 = async () => {
    let res = await generalSign();
    (document.getElementById('sign-btn') as HTMLButtonElement).disabled = true
    let neum_form = document.getElementsByClassName('neum-form')[0]
    let content = document.getElementById('neum-form-content')
    content!.style.opacity = '0'
    setTimeout(() => {
      content!.style.display = 'none'
      neum_form.classList.add('form-height')
      setStatus(res)
    }, 600)
  }
  const getuvToken = async () => {
    let token = await axios.post(uvtoken_api, {
      uf: userParams.uf,
      _d: userParams._d,
      vc3: userParams.vc3,
      uid: userParams._uid
    })
    return token.data._token
  }
  const uploadFile = async (inputFile: File, token: string) => {
    // 填入FormData
    let data = new FormData()
    data.append('uf', userParams.uf)
    data.append('_d', userParams._d)
    data.append('_uid', userParams._uid)
    data.append('vc3', userParams.vc3)
    data.append('file', inputFile)

    // 使用Token传文件，返回objectId
    let res = await axios.post(upload_api + `?_token=${token}`, data, {
      headers: {
        'Content-type': 'multipart/form-data'
      }
    })
    return res.data
  }

  useEffect(() => {
    let request = indexedDB.open('ui')
    request.onsuccess = () => {
      let db = request.result
      // 获取用户登录时间
      let request_IDBGET = db.transaction('user', 'readwrite')
        .objectStore('user')
        .get(params.phone as string)
      request_IDBGET.onsuccess = async (event) => {
        // 数据读取成功
        setUserParams(request_IDBGET.result)
        // 身份过期自动重新登陆
        if (Date.now() - request_IDBGET.result.date > 432000000) {
          let res = await axios.post(login_api, {
            phone: request_IDBGET.result.phone,
            password: request_IDBGET.result.password
          })
          if (res.data === 'AuthFailed') {
            setAlert({ msg: '重新登录失败', show: true, severity: 'error' })
          } else {
            let userParam = {
              phone: request_IDBGET.result.phone,
              fid: res.data.fid,
              vc3: res.data.vc3,
              password: request_IDBGET.result.password,
              _uid: res.data._uid,
              _d: res.data._d,
              uf: res.data.uf,
              name: res.data.name,
              date: new Date()
            }
            setUserParams(userParam)
            // 登陆成功将新信息写入数据库
            db.transaction('user', 'readwrite')
              .objectStore('user').put(userParam)
              .onsuccess = () => {
                setAlert({ msg: '凭证已自动更新', show: true, severity: 'success' })
              }
          }
        }
      }
    }
  }, [])

  return (
    <div>
      {
        control.start.show &&
        <ButtonBase
          id='start-btn'
          onClick={start}
          sx={{ borderRadius: 50 }}
          className='neum-button'
          disableRipple
        >
          <span>开始</span>
        </ButtonBase>
      }
      {
        progress &&
        <CircularProgress size='5rem' />
      }
      <h1>{sign.activity.name}</h1>
      {
        sign.activity.otherId === 0 &&
        <Box
          component='div'
          id='neum-form'
          className='neum-form'
        >
          <h3>{sign.status}</h3>
          <div id='neum-form-content' className='form-content'>
            <p className='form-title'>勾选签到方式</p><br />
            <label id='label-general' onClick={() => { handleRadio('general') }} className='checked' htmlFor='general' style={{ fontSize: '1.6rem' }}>
              <input hidden defaultChecked type='radio' name='sign' id='general' value='general' />
              &nbsp;普通
            </label>&emsp;
            <label id='label-photo' onClick={() => { handleRadio('photo') }} className='unchecked' htmlFor='photo' style={{ fontSize: '1.6rem' }}>
              <input hidden type='radio' name='sign' id='photo' value='photo' />
              &nbsp;拍照
            </label>
            <br />
            {
              radio === 1 &&
              <ButtonBase className='neum-form-button'
                onClick={() => {
                  document.getElementById('input-photo')!.click()
                }}
                sx={{
                  width: '16rem'
                }}
              >
                <div id='select-photo' className='text-button'>选择图片</div>
                <input
                  style={{
                    display: 'none'
                  }}
                  id='input-photo'
                  type='file'
                  accept='image/*'
                  onChange={async (e) => {
                    let select_photo = document.getElementById('select-photo')
                    if (e.target.value === '') {
                      select_photo!.innerText = '选择图片'
                    }
                    else {
                      select_photo!.innerText = e.target.value
                    }
                    updateValue('photo', e.target.files![0])
                  }}></input>
              </ButtonBase>
            }
            <ButtonBase
              id='sign-btn'
              onClick={onSign_0}
              className='neum-form-button'
              disableRipple>
              {
                btnProgress ? <CircularProgress size='2rem' /> : '签到'
              }
            </ButtonBase>
          </div>
        </Box>
      }
      {
        sign.activity.otherId === 2 &&
        <Box
          component='div'
          id='neum-form'
          className='neum-form'
          sx={{
            minHeight: '450px'
          }}
        >
          <h3>{sign.status}</h3>
          <div id='neum-form-content' className='form-content'>
            <p className='form-title'>填写enc参数</p><br />
            <input id='input-enc' className='input-area' type='text' onChange={(e) => {
              updateValue('enc', e.target.value)
            }} />
            <ButtonBase className='neum-form-button'
              onClick={() => {
                document.getElementById('qrcode-upload')!.click()
              }}
              sx={{
                width: '16rem'
              }}
            >
              {
                scanProgress ? <CircularProgress size='2rem' /> : <div>扫描图片</div>
              }
              <input
                style={{
                  display: 'none'
                }}
                id='qrcode-upload'
                type='file'
                accept='image/*'
                onChange={setEncByQRCodeImage}></input>
            </ButtonBase>
            <ButtonBase
              id='sign-btn'
              onClick={onSign_2}
              className='neum-form-button'
              disableRipple
            >签到</ButtonBase>
          </div>
        </Box>
      }
      {
        sign.activity.otherId === 4 &&
        <Box
          component='div'
          id='neum-form'
          className='neum-form'
        >
          <h3>{sign.status}</h3>
          <div id='neum-form-content' className='form-content'>
            <p className='form-title'>经纬度和地址</p><br />
            <input id='input-latlon' className='input-area' placeholder='例: 116.417492,39.920912' type='text'
              onChange={(e) => {
                updateValue('latlon', e.target.value)
                console.log(values)
              }} />
            <input id='input-address' className='input-area' placeholder='如: 河南省郑州市x区x大学' type='text'
              onChange={(e) => {
                updateValue('address', e.target.value)
                console.log(values)
              }} />
            <br />
            <ButtonBase
              id='sign-btn'
              onClick={onSign_4}
              className='neum-form-button'
              disableRipple
            >签到</ButtonBase>
          </div>
        </Box>
      }
      {
        (sign.activity.otherId === 3 || sign.activity.otherId === 5) &&
        <Box
          component='div'
          id='neum-form'
          className='neum-form'
        >
          <h3>{sign.status}</h3>
          <div id='neum-form-content' className='form-content'>
            <p className='form-title'>点击签到</p>
            <br />
            <ButtonBase
              id='sign-btn'
              onClick={onSign_35}
              className='neum-form-button'
              disableRipple
            >签到</ButtonBase>
          </div>
        </Box>
      }

      <Snackbar
        open={alert.show}
        autoHideDuration={3000}
        onClose={() => { setAlert({ show: false, severity: 'info', msg: '' }) }}
      >
        <Alert onClose={() => { setAlert({ show: false, severity: 'info', msg: '' }) }} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.msg}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default DashBoard