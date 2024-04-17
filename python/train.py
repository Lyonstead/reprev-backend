import torch
from recbole.config import Config
from recbole.data import create_dataset, data_preparation
from recbole.model.general_recommender import BPR
from recbole.trainer import Trainer
from recbole.utils import init_seed, init_logger

# Load configuration and dataset
config = Config(model='BPR', dataset='food_rating', config_file_list=['config.yaml'])
dataset = create_dataset(config)
train_data, valid_data, test_data = data_preparation(config, dataset)

# Initialize the model and trainer
model = BPR(config, train_data.dataset).to(config['device'])
trainer = Trainer(config, model)

# Train the model
trainer.fit(train_data)

def recommend_top_item_for_user(model, user_id, dataset):
    # Assuming dataset has an attribute that contains information about item field
    num_items = dataset.num(iid=True)  # Adjusted to use a method that should correctly return the number of items
    
    # The rest remains mostly unchanged
    user_idx = dataset.token2id(dataset.uid_field, [user_id])[0]
    user_tensor = torch.tensor([user_idx], dtype=torch.int64).to(model.device)
    all_item_ids = torch.arange(num_items, dtype=torch.int64).to(model.device)
    scores = model.predict(user_tensor, all_item_ids)
    top_item_index = torch.argmax(scores).item()
    top_item_id = dataset.id2token(dataset.iid_field, [top_item_index])[0]
    
    return top_item_id

user_id = '1'  # Replace with a valid user ID from your dataset
top_item_id = recommend_top_item_for_user(model, user_id, dataset)
print(f'The top recommended food for user {user_id} is item {top_item_id}.')
