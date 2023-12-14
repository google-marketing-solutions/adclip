import unittest
from languages import DefaultLanguage

class DefaultLanguageTest(unittest.TestCase):

  def test_get_clips_from_transcript(self):
    test_default_language = DefaultLanguage()
    transcript1 = [
      {
        "endTime": 1,
        "startTime": 0,
        "text": "lorem",
        "shouldKeep": True,
      },
      {
        "endTime": 2,
        "startTime": 1,
        "text": "ipsum",
        "shouldKeep": True,
      },
      {
        "endTime": 3,
        "startTime": 2,
        "text": "dolor",
        "shouldKeep": True,
      },
      {
        "endTime": 4,
        "startTime": 3,
        "text": "summary1",
      },
      {
        "endTime": 4,
        "startTime": 3,
        "text": "summary2",
      },
      {
        "endTime": 5,
        "startTime": 4,
        "text": "should_be_omitted",
      },
      {
        "endTime": 6,
        "startTime": 5,
        "text": "sit",
        "shouldKeep": True,
      },
      {
        "endTime": 7,
        "startTime": 6,
        "text": "amet",
        "shouldKeep": True,
      },
    ]
    summary1 = 'summary1 summary2'

    output1 = test_default_language.get_clips_from_transcript(transcript1,
                                                              summary1,
                                                              [])

    self.assertEqual(output1,
                     [{
                        "endTime": 4,
                        "startTime": 0,
                        "duration": 4,
                        "text": "lorem ipsum dolor summary1 summary2",
                        "words": transcript1[:5]

                      },
                      {
                        "endTime": 7,
                        "startTime": 5,
                        "duration": 2,
                        "text": "sit amet",
                        "words": transcript1[6:]
                      }])

if __name__ == '__main__':
    unittest.main()
