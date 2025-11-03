import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,

  ActivityIndicator,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {MenuRoutes} from '../../routes/Menu';
import {apiCall, useTheme, IMAGE_URL, Permissions, Size, fontFamily} from '../../modules';
import {Button, Header, Icon, MathJax} from '../../components';
import RNFS from 'react-native-fs';
import {useTranslation} from 'react-i18next';
import Animated, {
  Layout,
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import DownloadModal from '../../components/DownloadModal';

interface TilesInterface {
  ARCHIVE_FLAG: string;
  CLIENT_ID: number;
  CREATED_MODIFIED_DATE: string;
  DESCRIPTION: string | null;
  DOCUMENT: string | null;
  ID: number;
  IS_ACTIVE: number;
  KNOWLEDGEBASE_CATEGORY_ID: number;
  KNOWLEDGEBASE_CATEGORY_NAME: string;
  KNOWLEDGEBASE_SUB_CATEGORY_NAME: string;
  KNOWLEDGE_BASE_TYPE: string | null;
  KNOWLEDGE_SUB_CATEGORY_ID: number;
  LINK: string;
  READ_ONLY: string;
  TITLE: string;
  TYPE: 'L' | 'D';
}
interface KnowledgebaseProps extends MenuRoutes<'Knowledgebase'> {}
const Knowledgebase: React.FC<KnowledgebaseProps> = ({navigation}) => {
  const colors = useTheme();
  const {t} = useTranslation();
  const [faqs, setFaqs] = useState<{id: number; name: string}[]>([]);
  const [noDataMessage, setNoDataMessage] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<
    {id: number; subCategoryName: string}[]
  >([]);
  const [tiles, setTiles] = useState<TilesInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [downloading, setDownloading] = useState<{
    show: boolean;
    url: string | null;
    fileName: string;
  }>({
    show: false,
    url: null,
    fileName: '',
  });
  const [screenLevel, setScreenLevel] = useState<
    'category' | 'subcategory' | 'tiles'
  >('category');
  const [downloadingFiles, setDownloadingFiles] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedItems, setExpandedItems] = useState<{
    [key: number]: boolean;
  }>({});

  useEffect(() => {
    knowledgebaseheads();
  }, []);

  const knowledgebaseheads = async () => {
    setLoading(true);
    setNoDataMessage(null);
    try {
      const res = await apiCall.post('knowledgeBaseCategory/get', {});

      if (
        res.data &&
        Array.isArray(res.data.data) &&
        res.data.data.length > 0
      ) {
        setFaqs(
          res.data.data.map((item: any) => ({
            id: item.ID,
            name: item.NAME,
          })),
        );
      } else {
        setNoDataMessage(t('knowledgebase.errors.noData'));
      }
    } catch (error) {
      console.error('Error Fetching FAQs', error);
      setNoDataMessage(t('knowledgebase.errors.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async (categoryId: number) => {
    setLoadingDetails(true);
    try {
      const res = await apiCall.post('knowledgebaseSubCategory/get', {
        filter: ` AND KNOWLEDGEBASE_CATEGORY_ID = ${categoryId} `,
      });
      if (res.data && Array.isArray(res.data.data)) {
        setSubcategories(
          res.data.data.map((item: any) => ({
            id: item.ID,
            subCategoryName: item.NAME,
          })),
        );
        setScreenLevel('subcategory');
      }
    } catch (error) {
      console.error('Error Fetching Subcategories', error);
      Alert.alert(t('common.error'), t('knowledgebase.errors.fetchError'));
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchTiles = async (subcategoryId: number) => {
    setLoadingDetails(true);
    try {
      const res = await apiCall.post('knowledgeBase/get', {
        filter: ` AND KNOWLEDGEBASE_CATEGORY_ID = ${subcategoryId} `,
      });

      if (res.data.data) {
        setTiles(res.data.data);
        setScreenLevel('tiles');
      }
    } catch (error) {
      console.error('Error Fetching Tiles', error);
      Alert.alert(t('common.error'), t('knowledgebase.errors.fetchError'));
    } finally {
      setLoadingDetails(false);
    }
  };

  const requestStoragePermission = async (
    fileUrl: string,
    fileName: string,
  ) => {
    try {
      const hasPermission = await Permissions.checkStorage();
      if (!hasPermission) {
        const requested = await Permissions.requestStorage();
        // @ts-ignore
        if (!requested) {
          return;
        }
      }
      setDownloading({show: true, url: fileUrl, fileName: fileName});
    } catch (err) {
      console.warn('Storage permission error:', err);
      Alert.alert(
        t('downloadModal.permissionRequired'),
        t('downloadModal.storagePermission'),
      );
    }
  };

  const openFile = async (filePath: string) => {
    try {
      const fileExtension = filePath.split('.').pop()?.toLowerCase();
      let mimeType = 'application/octet-stream';
      const mimeTypes: {[key: string]: string} = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        txt: 'text/plain',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
      };
      if (fileExtension && mimeTypes[fileExtension]) {
        mimeType = mimeTypes[fileExtension];
      }
      Linking.sendIntent('android.intent.action.VIEW', [
        {key: 'data', value: `file://${filePath}`},
        {key: 'type', value: mimeType},
      ]);
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert(
        'Error',
        'Could not open the file. Please check if you have an app installed to open this type of file.',
      );
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    if (downloadingFiles[fileName]) {
      Alert.alert(
        'Download in Progress',
        'Please wait for the current download to complete',
      );
      return;
    }

    const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

    try {
      setDownloadingFiles(prev => ({...prev, [fileName]: true}));

      const fileExists = await RNFS.exists(filePath);

      if (fileExists) {
        Alert.alert(
          'File Already Exists',
          'What would you like to do?',
          [
            {
              text: 'Open',
              onPress: () => openFile(filePath),
            },
            {
              text: 'Download Again',
              onPress: () => startDownload(filePath, fileUrl, fileName),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
          {cancelable: true},
        );
        return;
      }

      await startDownload(filePath, fileUrl, fileName);
    } catch (error) {
      console.error('File operation error:', error);
      Alert.alert(
        'Error',
        'There was an error processing the file. Please try again.',
      );
    } finally {
      setDownloadingFiles(prev => ({...prev, [fileName]: false}));
    }
  };

  const startDownload = async (
    filePath: string,
    fileUrl: string,
    fileName: string,
  ) => {
    try {
      const response = await RNFS.downloadFile({
        fromUrl: fileUrl,
        toFile: filePath,
        background: true,
        progress: response => {
          const progress =
            (response.bytesWritten / response.contentLength) * 100;
        },
      }).promise;

      if (response.statusCode === 200) {
        setTimeout(() => {
          Alert.alert('Download Complete', `File saved to ${filePath}`, [
            {
              text: 'Open',
              onPress: () => openFile(filePath),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]);
        }, 500);
      } else {
        throw new Error(`Download failed with status: ${response.statusCode}`);
      }
    } catch (error) {
      console.error('Download Error:', error);
      Alert.alert(
        'Download Failed',
        'There was an error downloading the file. Please try again.',
      );
    }
  };
  const toggleExpand = (id: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  return (
    <SafeAreaView style={styles._container}>
      <View>
        <Header
          label={t('mainMenu.menuItems.knowledgeBase')}
          onBack={() => {
            if (screenLevel === 'tiles') {
              setScreenLevel('subcategory');
            } else if (screenLevel === 'subcategory') {
              setScreenLevel('category');
            } else {
              navigation.goBack();
            }
          }}
        />
      </View>

      {loading || loadingDetails ? (
        <ActivityIndicator
          size="large"
          color="#007BFF"
          style={styles._loading}
        />
      ) : screenLevel === 'category' ? (
        <>
          {noDataMessage ? (
            <View
              style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
              <Image
                source={require('../../assets/images/no-data.png')}
                style={{width: 180, height: 180}}
              />
              <Text style={{marginTop: Size.lg, color: colors.text,fontFamily: fontFamily}}>
                {noDataMessage}
              </Text>
            </View>
          ) : (
            <FlatList
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={false}
              data={faqs}
              keyExtractor={item => item.id.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles._faqItem}
                  onPress={() => fetchSubcategories(item.id)}>
                  <View style={styles._faqRow}>
                    <Text style={styles._txt}>{item.name}</Text>
                    <Icon
                      type="Feather"
                      name="chevron-right"
                      size={23}
                      color={'#8F90A6'}
                    />
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      ) : screenLevel === 'subcategory' ? (
        <FlatList
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={false}
          data={subcategories}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles._faqItem}
              onPress={() => fetchTiles(item.id)}>
              <View style={styles._faqRow}>
                <Text style={styles._txt}>{item.subCategoryName}</Text>
                <Icon
                  type="Feather"
                  name="chevron-right"
                  size={23}
                  color={'#8F90A6'}
                />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                paddingTop: 50,
              }}>
              <Image
                source={require('../../assets/images/no-data.png')}
                style={{width: 180, height: 180}}
              />
              <Text style={{marginTop: Size.lg, color: colors.text,fontFamily: fontFamily}}>
                {t('knowledgebase.errors.noData')}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          removeClippedSubviews={false}
          data={tiles}
          showsVerticalScrollIndicator={false}
          keyExtractor={item => item.ID.toString()}
          renderItem={({item}) => {
            const isExpanded = expandedItems[item.ID] || false;
            return (
              <Animated.View
                style={styles._faqAnswerContainer}
                layout={LinearTransition.stiffness(45).duration(300)}
                entering={FadeIn}
                exiting={FadeOut}>
                <View style={styles._tileHeader}>
                  <View style={styles._tileFooter}>
                    <Text style={styles._tileCategory}>
                      {item.KNOWLEDGEBASE_CATEGORY_NAME}
                    </Text>
                    <Icon
                      type="AntDesign"
                      name="right"
                      size={15}
                      color="#8F90A6"
                    />
                    <Text style={styles._tileSubcategory}>
                      {item.KNOWLEDGEBASE_SUB_CATEGORY_NAME}
                    </Text>
                  </View>
                  {item.TYPE === 'L' && (
                    <Icon
                      type="AntDesign"
                      name="link"
                      size={15}
                      color="#2A3B8F"
                      onPress={() => {
                        if (item.LINK) {
                          Linking.openURL(item.LINK);
                        }
                      }}
                    />
                  )}
                  {item.TYPE === 'D' && (
                    <>
                      {downloadingFiles[item?.DOCUMENT || ''] ? (
                        <ActivityIndicator size="small" color="#3170DE" />
                      ) : (
                        <Icon
                          type="MaterialIcons"
                          name="description"
                          size={24}
                          color="#2A3B8F"
                          onPress={() => {
                            if (item.TYPE === 'D' && item.DOCUMENT) {
                              setDownloading({
                                fileName: item.DOCUMENT,
                                show: true,
                                url: `${IMAGE_URL}KnowledgeBaseDoc/${item.DOCUMENT}`,
                              });
                              // requestStoragePermission(
                              //   `${IMAGE_URL}KnowledgeBaseDoc/${item.DOCUMENT}`,
                              //   item.DOCUMENT,
                              // );
                            }
                          }}
                        />
                      )}
                    </>
                  )}
                </View>
                <View
                  style={{
                    // flex: 1,
                    backgroundColor: '#CBCBCB',
                    width: '100%',
                    height: 1,
                  }}
                />
                <TouchableOpacity
                  onPress={() => toggleExpand(item.ID)}
                  style={styles._tileHeader}>
                  <View style={styles._tileFooter}>
                    <Text style={styles._tileCategory} numberOfLines={1}>
                      {item.TITLE}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      toggleExpand(item.ID);
                    }}>
                    <Icon
                      type="Entypo"
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color="#8F90A6"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>

                {isExpanded &&
                  item.DESCRIPTION !== null &&
                  item.DESCRIPTION.trim() !== '' &&
                  item.DESCRIPTION.toLowerCase() !== 'null' && (
                    <Animated.View
                      entering={FadeIn.duration(200)}
                      exiting={FadeOut.duration(200)}>
                      <MathJax text={item.DESCRIPTION} />
                    </Animated.View>
                  )}
              </Animated.View>
            );
          }}
          ListEmptyComponent={
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
                paddingTop: 50,
              }}>
              <Image
                source={require('../../assets/images/no-data.png')}
                style={{width: 180, height: 180}}
              />
              <Text style={{marginTop: Size.lg, color: colors.text,fontFamily: fontFamily}}>
                {t('knowledgebase.errors.noData')}
              </Text>
            </View>
          }
        />
      )}
      {downloading.show && downloading.url && (
        <DownloadModal
          url={downloading.url}
          fileName={downloading.fileName}
          onClose={() => setDownloading({show: false, url: null, fileName: ''})}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  _container: {
    flex: 1,
    backgroundColor: '#F6F8FF',
  },
  _headingTxt: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  _faqItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomColor: '#ddd',
  },
  _faqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    padding: 10,
    borderColor: '#CBCBCB',
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  _txt: {
    fontSize: 16,
    fontFamily: fontFamily
  },
  _faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
    margin: 10,
    borderRadius: 8,
    borderColor: '#CBCBCBC',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  _faqTitle: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  _loading: {
    marginTop: 20,
    alignSelf: 'center',
  },
  _description: {
    fontSize: 14,
    fontWeight: '400',
  },
  _downloadcontainer: {
    marginVertical: 10,
    marginRight: 10,
    marginLeft: 5,
    alignSelf: 'flex-end',
    backgroundColor: '#3170DE',
    borderRadius: 8,
  },
  _linkText: {
    color: 'blue',
    textDecorationLine: 'underline',
    marginTop: 5,
  },
  _downloadText: {
    fontSize: 14,
    padding: 10,
    color: '#fff',
  },
  // New styles for tiles
  _tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  _tileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  _tileDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  _tileFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginTop: 8,
    // paddingTop: 8,
    // borderTopWidth: 1,
    // borderTopColor: '#eee',
  },
  _tileCategory: {
    fontSize: 14,
    color: '#3170DE',
    fontWeight: '400',
    fontFamily: fontFamily
  },
  _tileSubcategory: {
    fontSize: 14,
    color: 'black',
    fontWeight: '400',
    fontFamily: fontFamily
  },
});

export default Knowledgebase;
