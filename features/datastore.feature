Feature: Datastore Provider

  Scenario: Saving, Retrieving and Deleting
    Given a configured elastic client is created
    And a configured datastore provider is created
    And test models are created
    And the indices for models are cleared
    When a MODEL_1 with DATA_1 is created
    And the model instance is saved
    And MODEL_1 retrieve is called with the id from DATA_1
    Then the object data matches DATA_1
    When the model instance is deleted
    And MODEL_1 retrieve is called with the id from DATA_1
    Then the result is UNDEFINED

  Scenario: Bulk Inserting
    Given a configured elastic client is created
    And a configured datastore provider is created
    And test models are created
    And the indices for models are cleared
    When many instances of MODEL_1 are created using DATA_2
    And bulk insert is called on MODEL_1 with the model instances
    And MODEL_1 retrieve is called with the id from DATA_2a
    Then the object data matches DATA_2a
    When MODEL_1 retrieve is called with the id from DATA_2b
    Then the object data matches DATA_2b
    When MODEL_1 retrieve is called with the id from DATA_2c
    Then the object data matches DATA_2c

  Scenario: Search
    Given a configured elastic client is created
    And a configured datastore provider is created
    And test models are created
    And the indices for models are cleared
    When many instances of MODEL_1 are created using DATA_2
    And bulk insert is called on MODEL_1 with the model instances
    When a search is called on MODEL_1 with TEXT_MATCH_SEARCH
    Then the search results matches SEARCH_RESULT_1
    When a search is called on MODEL_1 with CASE_TEXT_MATCH_SEARCH
    Then the search results matches SEARCH_RESULT_11
    When a search is called on MODEL_1 with BAD_CASE_TEXT_MATCH_SEARCH
    Then the search results matches EMPTY_RESULT
    When a search is called on MODEL_1 with NUMBER_RANGE_SEARCH
    Then the search results matches SEARCH_RESULT_2
    When a search is called on MODEL_1 with TEXT_STARTS_WITH_SEARCH
    Then the search results matches SEARCH_RESULT_3
    When a search is called on MODEL_1 with CASE_TEXT_ENDS_WITH_SEARCH
    Then the search results matches SEARCH_RESULT_12
    When a search is called on MODEL_1 with TEXT_ENDS_WITH_SEARCH
    Then the search results matches SEARCH_RESULT_4
    When a search is called on MODEL_1 with FREE_FORM_TEXT_SEARCH
    Then the search results matches SEARCH_RESULT_5
    When a search is called on MODEL_1 with BOOLEAN_SEARCH
    Then the search results matches SEARCH_RESULT_6
    When a search is called on MODEL_1 with TWO_PROPERTY_SEARCH
    Then the search results matches SEARCH_RESULT_10
    When a search is called on MODEL_1 with TWO_TEXT_SEARCH
    Then the search results matches EMPTY_RESULT
    When a search is called on MODEL_1 with SIMPLE_AND_SEARCH
    Then the search results matches SEARCH_RESULT_8
    When a search is called on MODEL_1 with SIMPLE_OR_SEARCH
    Then the search results matches SEARCH_RESULT_9
    When a search is called on MODEL_1 with DATE_RANGE_SEARCH
    Then the search results matches SEARCH_RESULT_7
    When a search is called on MODEL_1 with COMPLEX_BOOLEAN_SEARCH
    Then the search results matches SEARCH_RESULT_13
