import { defineComponent, ref, toRaw } from 'vue'
import { open } from '@tauri-apps/api/dialog'
import { fs } from '@tauri-apps/api'
import { Button, Modal, message } from 'ant-design-vue'
import { relaunch } from '@tauri-apps/api/process'
import { delay } from 'vue3-ts-util'
import { t } from './i18n'
import { invoke } from '@tauri-apps/api/tauri'
export const appConfFilename = 'app.conf.json'
interface TauriAppLaunchConf {
  sdstartfk_dir: string
}
const conf = ref<TauriAppLaunchConf>()
const save = () => {
  return fs.writeFile(appConfFilename, JSON.stringify(toRaw(conf.value), null, 4))
}

const TauriLaunchConfModal = defineComponent({
  setup () {

    const onSelectSdStartfkClick = async () => {
      const dir = await open({ directory: true })
      if (typeof dir === 'string') {
        if (!(await fs.exists(`${dir}/config.json`))) {
          return message.error(t('tauriLaunchConfMessages.configNotFound'))
        }
        if (!(await fs.exists(`${dir}/extensions/startfk-infinite-image-browsing`))) {
          return message.error(t('tauriLaunchConfMessages.folderNotFound'))
        }
        conf.value!.sdstartfk_dir = dir
        message.info(t('tauriLaunchConfMessages.configCompletedMessage'))
        await save()
        await invoke('shutdown_api_server_command')
        await delay(1500)
        await relaunch()
      }
    }

    return () => (
      <div style={{ padding: '32px 0' }}>
        <div style={{ padding: '16px 0' }}>
          <h2>{t('tauriLaunchConf.readSdStartfkConfigTitle')}</h2>
          <p>
            {t('tauriLaunchConf.readSdStartfkConfigDescription')}
          </p>
          <Button onClick={onSelectSdStartfkClick} type="primary">
            {t('tauriLaunchConf.selectSdStartfkFolder')}
          </Button>
        </div>
        <div style={{ padding: '16px 0' }}>
          <h2>{t('tauriLaunchConf.skipThisConfigTitle')}</h2>
          <p>{t('tauriLaunchConf.skipThisConfigDescription')}</p>
          <Button type="primary" onClick={Modal.destroyAll}>
            {t('tauriLaunchConf.skipButton')}
          </Button>
        </div>
      </div>
    )
  }
})

export const openModal = async () => {
  try {
    conf.value = JSON.parse(await fs.readTextFile(appConfFilename))
  } catch (error) { }
  if (!conf.value) {
    conf.value = {
      sdstartfk_dir: ''
    }
    await save()
    Modal.info({
      title: t('tauriLaunchConfMessages.firstTimeUserTitle'),
      content: <TauriLaunchConfModal />,
      width: '80vw',
      okText: t('tauriLaunchConf.skipButton'),
      okButtonProps: {
        onClick: Modal.destroyAll
      }
    })
  }
}